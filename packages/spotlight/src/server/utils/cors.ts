import dns from "node:dns/promises";
import net from "node:net";
import os from "node:os";

/**
 * DNS Resolution Cache Entry
 */
interface CacheEntry {
  isLocal: boolean;
  expiresAt: number;
}

/**
 * DNS Resolution Result with optional TTL
 */
interface DnsResult {
  address: string;
  ttl?: number;
}

/**
 * Cache for DNS resolution results.
 * Key: lowercase hostname
 * Value: { isLocal, expiresAt }
 */
const dnsCache = new Map<string, CacheEntry>();

/**
 * In-flight DNS resolutions for request coalescing.
 * Prevents duplicate DNS lookups when multiple requests come in
 * for the same hostname before the first one completes.
 */
const pendingResolutions = new Map<string, Promise<boolean>>();

/**
 * TTL Constants (in milliseconds)
 *
 * DNS Rebinding Attack Protection:
 * ================================
 * A DNS rebinding attack works by:
 * 1. Attacker controls evil.com with a short TTL
 * 2. User visits evil.com, which initially resolves to attacker's server
 * 3. Attacker's page loads malicious JavaScript
 * 4. Attacker rebinds evil.com to 127.0.0.1
 * 5. JavaScript makes requests to evil.com (now 127.0.0.1), bypassing same-origin policy
 *
 * Our mitigation: Reject DNS records with TTL < 1 hour.
 * This means an attacker would need to set a TTL >= 1 hour, making their
 * site inaccessible for that duration after rebinding. This makes the attack
 * impractical for real-world exploitation.
 */
const MIN_TTL_SECONDS = 60 * 60; // 1 hour - reject DNS records with lower TTL
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour - used when DNS doesn't provide TTL (e.g., /etc/hosts)
const FAILURE_TTL_MS = 5 * 60 * 1000; // 5 minutes - cache failed lookups to avoid hammering DNS

/**
 * DNS resolution notes:
 * We use both resolve4/6 AND lookup because:
 * - dns.resolve4/6: Queries DNS servers directly, can return TTL
 * - dns.lookup: Uses OS resolver (getaddrinfo), checks /etc/hosts first, then DNS
 *
 * A hostname in /etc/hosts won't be found by resolve4/6, hence we need both.
 * We can only trust lookup results when DNS (resolve4/6) fails - that means
 * the result came from /etc/hosts rather than DNS.
 */

/**
 * Cache for machine's own IP addresses.
 * Refreshed periodically as network interfaces can change.
 */
let machineIPsCache: Set<string> | null = null;
let machineIPsCacheTime = 0;
const MACHINE_IPS_CACHE_TTL_MS = 60 * 1000; // 1 minute - refresh periodically for network changes

/**
 * Get all IP addresses assigned to this machine's network interfaces.
 * This includes:
 * - Loopback (127.0.0.1, ::1)
 * - Local/private IPs (192.168.x.x, 10.x.x.x, etc.)
 * - VPN IPs (e.g., Tailscale 100.x.x.x, Zerotier IPs)
 *
 * Results are cached for 1 minute to handle network changes while
 * avoiding repeated system calls.
 */
function getMachineIPs(): Set<string> {
  const now = Date.now();
  if (machineIPsCache && now - machineIPsCacheTime < MACHINE_IPS_CACHE_TTL_MS) {
    return machineIPsCache;
  }

  const ips = new Set<string>();
  const interfaces = os.networkInterfaces();

  for (const name in interfaces) {
    const addresses = interfaces[name];
    if (addresses) {
      for (const addr of addresses) {
        ips.add(addr.address);
      }
    }
  }

  machineIPsCache = ips;
  machineIPsCacheTime = now;
  return ips;
}

/**
 * Check if a string is an IP address (IPv4 or IPv6).
 */
function isIPAddress(hostname: string): boolean {
  // Handle bracketed IPv6 (e.g., [::1])
  const cleanHostname = hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
  return net.isIP(cleanHostname) !== 0;
}

/**
 * Check if an IP address belongs to this machine.
 * See getMachineIPs() for details on what IPs are considered local.
 */
function isLocalMachineIP(ip: string): boolean {
  // Handle bracketed IPv6
  const cleanIP = ip.startsWith("[") && ip.endsWith("]") ? ip.slice(1, -1) : ip;
  const machineIPs = getMachineIPs();
  return machineIPs.has(cleanIP);
}

/**
 * Resolution result with source information for trust decisions.
 */
interface ResolutionResult {
  /** Addresses from dns.resolve4/6() with TTL */
  dnsAddresses: DnsResult[];
  /** Addresses from dns.lookup() when DNS failed - these are from /etc/hosts */
  hostsFileAddresses: string[];
  /** Minimum TTL from DNS results (seconds) */
  minTtl?: number;
}

/**
 * Resolve a hostname to IP addresses using both DNS and OS resolver.
 *
 * Why both dns.resolve() and dns.lookup()?
 * - dns.resolve4/6: Direct DNS query, returns TTL when available
 * - dns.lookup: Uses OS resolver (getaddrinfo), which reads /etc/hosts
 *
 * A hostname in /etc/hosts won't be found by resolve4/6, hence we need both.
 *
 * Trust model:
 * - If dns.resolve() succeeds → result is from DNS, needs TTL validation
 * - If dns.resolve() fails but dns.lookup() succeeds → result is from /etc/hosts, trusted
 *
 * We can only trust lookup results when DNS failed, because lookup also queries
 * DNS servers (via the OS resolver) if the hostname isn't in /etc/hosts.
 */
async function resolveHostname(hostname: string): Promise<ResolutionResult> {
  const dnsAddresses: DnsResult[] = [];
  const hostsFileAddresses: string[] = [];
  let minTtl: number | undefined;

  // Run all resolution methods in parallel for efficiency
  const [resolve4Result, resolve6Result, lookupResult] = await Promise.allSettled([
    dns.resolve4(hostname, { ttl: true }),
    dns.resolve6(hostname, { ttl: true }),
    dns.lookup(hostname, { all: true }),
  ]);

  const dnsSucceeded = resolve4Result.status === "fulfilled" || resolve6Result.status === "fulfilled";

  // Process IPv4 DNS results (with TTL)
  if (resolve4Result.status === "fulfilled") {
    for (const record of resolve4Result.value) {
      dnsAddresses.push({ address: record.address, ttl: record.ttl });
      if (record.ttl !== undefined) {
        minTtl = minTtl === undefined ? record.ttl : Math.min(minTtl, record.ttl);
      }
    }
  }

  // Process IPv6 DNS results (with TTL)
  if (resolve6Result.status === "fulfilled") {
    for (const record of resolve6Result.value) {
      dnsAddresses.push({ address: record.address, ttl: record.ttl });
      if (record.ttl !== undefined) {
        minTtl = minTtl === undefined ? record.ttl : Math.min(minTtl, record.ttl);
      }
    }
  }

  // Process OS resolver results - ONLY trusted if DNS failed
  // If DNS succeeded, lookup would return the same DNS result (not trusted separately)
  // If DNS failed but lookup succeeded, it must be from /etc/hosts (trusted)
  if (!dnsSucceeded && lookupResult.status === "fulfilled") {
    const lookupAddresses = Array.isArray(lookupResult.value) ? lookupResult.value : [lookupResult.value];
    for (const record of lookupAddresses) {
      hostsFileAddresses.push(record.address);
    }
  }

  return { dnsAddresses, hostsFileAddresses, minTtl };
}

/**
 * Perform the actual DNS resolution and cache the result.
 * This is separated from isHostnameLocal to enable request coalescing.
 */
async function resolveAndCacheHostname(hostname: string): Promise<boolean> {
  try {
    const { dnsAddresses, hostsFileAddresses, minTtl } = await resolveHostname(hostname);

    // First check /etc/hosts addresses (trusted - DNS failed, so these must be from hosts file)
    // These are under local control and don't need TTL validation
    const hostsLocal = hostsFileAddresses.some(addr => isLocalMachineIP(addr));
    if (hostsLocal) {
      // /etc/hosts entry resolves to local - cache and allow
      dnsCache.set(hostname, {
        isLocal: true,
        expiresAt: Date.now() + DEFAULT_TTL_MS,
      });
      return true;
    }

    // Check DNS addresses (need TTL validation for rebinding protection)
    const dnsLocal = dnsAddresses.some(result => isLocalMachineIP(result.address));

    if (dnsLocal) {
      // DNS rebinding protection: reject records with TTL < 1 hour
      if (minTtl !== undefined && minTtl < MIN_TTL_SECONDS) {
        // Low TTL is suspicious - reject and cache as non-local
        dnsCache.set(hostname, {
          isLocal: false,
          expiresAt: Date.now() + FAILURE_TTL_MS,
        });
        return false;
      }

      // DNS resolves to local with safe TTL
      const cacheTtl = minTtl !== undefined ? minTtl * 1000 : DEFAULT_TTL_MS;
      dnsCache.set(hostname, {
        isLocal: true,
        expiresAt: Date.now() + cacheTtl,
      });
      return true;
    }

    // Not a local address - cache the negative result
    const cacheTtl = minTtl !== undefined ? minTtl * 1000 : DEFAULT_TTL_MS;
    dnsCache.set(hostname, {
      isLocal: false,
      expiresAt: Date.now() + cacheTtl,
    });
    return false;
  } catch {
    // DNS resolution failed - cache the failure briefly
    dnsCache.set(hostname, {
      isLocal: false,
      expiresAt: Date.now() + FAILURE_TTL_MS,
    });
    return false;
  }
}

/**
 * Check if a hostname resolves to this machine, with DNS rebinding protection.
 *
 * Returns true if the hostname resolves to a local IP AND has a safe TTL.
 * DNS records with TTL < 1 hour are rejected to prevent rebinding attacks.
 * Results are cached to avoid repeated DNS lookups.
 *
 * Uses request coalescing: if multiple requests come in for the same hostname
 * before the first resolution completes, they all share the same promise.
 */
async function isHostnameLocal(hostname: string): Promise<boolean> {
  // Check cache first
  const cached = dnsCache.get(hostname);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.isLocal;
  }

  // Check if there's already an in-flight resolution for this hostname
  const pending = pendingResolutions.get(hostname);
  if (pending) {
    return pending;
  }

  // Start a new resolution and track it
  const resolution = resolveAndCacheHostname(hostname);
  pendingResolutions.set(hostname, resolution);

  try {
    return await resolution;
  } finally {
    pendingResolutions.delete(hostname);
  }
}

/**
 * Check if an origin is from spotlightjs.com (HTTPS only, default port).
 */
function isSpotlightOrigin(url: URL, hostname: string): boolean {
  if (hostname === "spotlightjs.com" || hostname.endsWith(".spotlightjs.com")) {
    return url.protocol === "https:" && (url.port === "" || url.port === "443");
  }
  return false;
}

/**
 * Clear the DNS cache, pending resolutions, and machine IPs cache. Useful for testing.
 */
export function clearDnsCache(): void {
  dnsCache.clear();
  pendingResolutions.clear();
  machineIPsCache = null;
  machineIPsCacheTime = 0;
}

/**
 * Get the current DNS cache size. Useful for testing.
 */
export function getDnsCacheSize(): number {
  return dnsCache.size;
}

/**
 * Validates if an origin should be allowed to access the Sidecar.
 *
 * Allowed origins:
 * - localhost (RFC 6761 reserved name, always trusted)
 * - Any origin whose hostname resolves to this machine's IPs (with TTL >= 1h)
 * - https://spotlightjs.com and subdomains (HTTPS only, default port)
 *
 * For DNS rebinding protection details, see the TTL Constants section above.
 *
 * @param origin - The origin to validate
 * @returns Promise<boolean> - true if the origin is allowed, false otherwise
 */
export async function isAllowedOrigin(origin: string): Promise<boolean> {
  if (!origin) {
    return false;
  }

  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();

    // Fast path: localhost is always allowed (RFC 6761 reserved name)
    // This is safe because "localhost" is guaranteed to resolve to loopback
    // and cannot be registered as a public domain name.
    if (hostname === "localhost") {
      return true;
    }

    // Fast path: spotlightjs.com domains (no DNS lookup needed)
    if (isSpotlightOrigin(url, hostname)) {
      return true;
    }

    // Fast path: If hostname is already an IP address, check directly
    if (isIPAddress(hostname)) {
      return isLocalMachineIP(hostname);
    }

    // Resolve hostname and check if it's local (with caching and TTL validation)
    return isHostnameLocal(hostname);
  } catch {
    // Invalid URL
    return false;
  }
}
