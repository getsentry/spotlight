import dns from "node:dns";
import net from "node:net";
import os from "node:os";
import { promisify } from "node:util";

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
 * Our mitigation: Enforce a minimum 6-hour cache for DNS resolutions.
 * This means an attacker would need to:
 * - Trick the user into visiting their site
 * - Keep the user on the page (or have them revisit) for 6+ hours
 * - Then rebind the DNS to 127.0.0.1
 *
 * Even then, rebinding to 127.0.0.1 with a low TTL would mean the attacker's
 * site becomes inaccessible for the cache duration. This makes the attack
 * impractical for real-world exploitation.
 */
const MIN_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours - minimum cache to prevent DNS rebinding
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour - used when DNS doesn't provide TTL (e.g., /etc/hosts)
const FAILURE_TTL_MS = 5 * 60 * 1000; // 5 minutes - cache failed lookups to avoid hammering DNS

/**
 * Promisified DNS functions.
 * We use both resolve4/6 AND lookup because:
 * - dns.resolve4/6: Queries DNS servers directly, can return TTL
 * - dns.lookup: Uses OS resolver (getaddrinfo), reads /etc/hosts
 *
 * A hostname in /etc/hosts won't be found by resolve4/6, hence we need both.
 */
const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);
const lookup = promisify(dns.lookup);

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
 * - Local/private IPs (192.168.x.x, 10.x.x.x, etc.)
 * - VPN IPs (e.g., Tailscale 100.x.x.x, Zerotier IPs)
 * - Any other interface IPs
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
        // Add the IP address (normalized)
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
 * Uses Node's net module for reliable detection.
 */
function isIPAddress(hostname: string): boolean {
  // Handle bracketed IPv6 (e.g., [::1])
  const cleanHostname = hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
  return net.isIP(cleanHostname) !== 0;
}

/**
 * Check if an IP address is a loopback address.
 *
 * Loopback addresses:
 * - IPv4: 127.0.0.0/8 (127.0.0.1 through 127.255.255.255)
 * - IPv6: ::1
 */
function isLoopbackIP(ip: string): boolean {
  // Handle bracketed IPv6
  const cleanIP = ip.startsWith("[") && ip.endsWith("]") ? ip.slice(1, -1) : ip;

  // IPv4 loopback: 127.0.0.0/8
  if (net.isIPv4(cleanIP)) {
    return cleanIP.startsWith("127.");
  }

  // IPv6 loopback: ::1
  if (net.isIPv6(cleanIP)) {
    // Normalize and compare - ::1 is the only loopback
    return cleanIP === "::1" || cleanIP === "0:0:0:0:0:0:0:1";
  }

  return false;
}

/**
 * Check if an IP address belongs to this machine.
 *
 * This includes:
 * - Loopback addresses (127.0.0.0/8, ::1)
 * - Any IP assigned to the machine's network interfaces
 *   (local IPs, VPN IPs like Tailscale/Zerotier, etc.)
 *
 * This allows services like custom domains pointing to the machine,
 * or VPN-based access, to work with Spotlight.
 *
 * Security note: This is safe because:
 * - These are IPs the machine actually has assigned
 * - External access requires explicit port forwarding/exposure
 * - The 6-hour DNS cache still protects against rebinding attacks
 */
function isLocalMachineIP(ip: string): boolean {
  // Handle bracketed IPv6
  const cleanIP = ip.startsWith("[") && ip.endsWith("]") ? ip.slice(1, -1) : ip;

  // Check loopback first (fast path)
  if (isLoopbackIP(cleanIP)) {
    return true;
  }

  // Check if it's one of the machine's own IPs
  const machineIPs = getMachineIPs();
  return machineIPs.has(cleanIP);
}

/**
 * Resolve a hostname to IP addresses using both DNS and OS resolver.
 *
 * Why both dns.resolve() and dns.lookup()?
 * - dns.resolve4/6: Direct DNS query, returns TTL when available
 * - dns.lookup: Uses OS resolver (getaddrinfo), which reads /etc/hosts
 *
 * This ensures we handle both:
 * - Standard DNS hostnames
 * - Local hostnames defined in /etc/hosts (common in development)
 *
 * @returns Array of resolved IPs with optional TTL, and the minimum TTL found
 */
async function resolveHostname(hostname: string): Promise<{ addresses: DnsResult[]; minTtl?: number }> {
  const results: DnsResult[] = [];
  let minTtl: number | undefined;

  // Run all resolution methods in parallel for efficiency
  const [resolve4Result, resolve6Result, lookupResult] = await Promise.allSettled([
    resolve4(hostname, { ttl: true }),
    resolve6(hostname, { ttl: true }),
    lookup(hostname, { all: true }),
  ]);

  // Process IPv4 DNS results (with TTL)
  if (resolve4Result.status === "fulfilled") {
    for (const record of resolve4Result.value) {
      results.push({ address: record.address, ttl: record.ttl });
      if (record.ttl !== undefined) {
        minTtl = minTtl === undefined ? record.ttl : Math.min(minTtl, record.ttl);
      }
    }
  }

  // Process IPv6 DNS results (with TTL)
  if (resolve6Result.status === "fulfilled") {
    for (const record of resolve6Result.value) {
      results.push({ address: record.address, ttl: record.ttl });
      if (record.ttl !== undefined) {
        minTtl = minTtl === undefined ? record.ttl : Math.min(minTtl, record.ttl);
      }
    }
  }

  // Process OS resolver results (no TTL available - from /etc/hosts or system DNS cache)
  if (lookupResult.status === "fulfilled") {
    const lookupAddresses = Array.isArray(lookupResult.value) ? lookupResult.value : [lookupResult.value];
    for (const record of lookupAddresses) {
      // Avoid duplicates from DNS resolve
      if (!results.some(r => r.address === record.address)) {
        results.push({ address: record.address }); // No TTL from lookup
      }
    }
  }

  return { addresses: results, minTtl };
}

/**
 * Calculate the cache TTL based on DNS response.
 *
 * TTL Rules:
 * 1. If DNS provides TTL >= 6h: use DNS TTL
 * 2. If DNS provides TTL < 6h: use 6h (minimum for rebinding protection)
 * 3. If no TTL provided (e.g., /etc/hosts): use 1h default
 */
function calculateCacheTtl(minTtl?: number): number {
  if (minTtl === undefined) {
    return DEFAULT_TTL_MS;
  }
  // Convert seconds to milliseconds and enforce minimum
  const ttlMs = minTtl * 1000;
  return Math.max(ttlMs, MIN_TTL_MS);
}

/**
 * Clear the DNS cache and machine IPs cache. Useful for testing.
 */
export function clearDnsCache(): void {
  dnsCache.clear();
  machineIPsCache = null;
  machineIPsCacheTime = 0;
}

/**
 * Get the current cache size. Useful for testing and monitoring.
 */
export function getDnsCacheSize(): number {
  return dnsCache.size;
}

/**
 * Validates if an origin should be allowed to access the Sidecar.
 *
 * Allowed origins:
 * - Any origin whose hostname resolves to this machine's IPs:
 *   - Loopback addresses (127.0.0.0/8, ::1)
 *   - Any IP assigned to the machine's network interfaces
 *     (local IPs, VPN IPs like Tailscale/Zerotier, etc.)
 * - https://spotlightjs.com (HTTPS only, default port)
 * - https://*.spotlightjs.com (HTTPS only, default port)
 *
 * Security: DNS Rebinding Protection
 * ==================================
 * Instead of hardcoding "localhost" and known IPs, we resolve hostnames via DNS
 * and check if they point to this machine. This allows:
 * - Custom local hostnames (e.g., from /etc/hosts)
 * - VPN-based access (Tailscale, Zerotier, etc.)
 * - Custom domains pointing to the machine
 *
 * We protect against DNS rebinding attacks through a minimum 6-hour cache TTL.
 *
 * Threat Model:
 * - An attacker controlling evil.com could try to rebind it to 127.0.0.1
 * - Our 6h minimum cache means the attacker must keep the user engaged for 6+ hours
 * - Even then, rebinding to 127.0.0.1 would make their site inaccessible
 * - This makes DNS rebinding attacks impractical against Spotlight
 *
 * For machine IPs (non-loopback), the risk is even lower because:
 * - External access requires explicit port forwarding/exposure
 * - Most machines are behind NAT, blocking inbound connections by default
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

    // Fast path: If hostname is already an IP address, check directly
    if (isIPAddress(hostname)) {
      return isLocalMachineIP(hostname);
    }

    // Check cache first
    const cached = dnsCache.get(hostname);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.isLocal;
    }

    // Check for spotlightjs.com domains - must be HTTPS with default port
    // These are always allowed regardless of what they resolve to
    if (hostname === "spotlightjs.com" || hostname.endsWith(".spotlightjs.com")) {
      if (url.protocol === "https:" && (url.port === "" || url.port === "443")) {
        return true;
      }
      return false;
    }

    // Resolve hostname via DNS and check if it points to this machine
    try {
      const { addresses, minTtl } = await resolveHostname(hostname);

      // Check if any resolved address belongs to this machine
      const isLocal = addresses.some(result => isLocalMachineIP(result.address));

      // Calculate cache TTL (enforcing minimum for security)
      const cacheTtl = calculateCacheTtl(minTtl);

      // Cache the result
      dnsCache.set(hostname, {
        isLocal,
        expiresAt: Date.now() + cacheTtl,
      });

      return isLocal;
    } catch {
      // DNS resolution failed - cache the failure for a short time
      // to avoid hammering DNS servers
      dnsCache.set(hostname, {
        isLocal: false,
        expiresAt: Date.now() + FAILURE_TTL_MS,
      });
      return false;
    }
  } catch {
    // Invalid URL
    return false;
  }
}
