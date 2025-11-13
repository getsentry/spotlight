import { existsSync, readFileSync } from "node:fs";
import { delimiter } from "node:path";
import { parse as parseYaml } from "yaml";
import { logger } from "../logger.ts";

const COMPOSE_FILE_NAMES = ["docker-compose.yaml", "docker-compose.yml", "compose.yml", "compose.yaml"] as const;

/**
 * Get compose files from COMPOSE_FILE environment variable
 * Returns an array of file paths if the variable is set, null otherwise
 */
export function getComposeFilesFromEnv(): string[] | null {
  const composeFileEnv = process.env.COMPOSE_FILE;
  if (!composeFileEnv) {
    return null;
  }

  // Split by platform-specific path delimiter (: on Unix, ; on Windows)
  const files = composeFileEnv
    .split(delimiter)
    .map(f => f.trim())
    .filter(f => f.length > 0);

  return files.length > 0 ? files : null;
}

/**
 * Find the compose file in the current directory
 */
export function findComposeFile(): string | null {
  for (const fileName of COMPOSE_FILE_NAMES) {
    if (existsSync(fileName)) {
      return fileName;
    }
  }
  return null;
}

/**
 * Find the override file for a given compose file
 */
export function findOverrideFile(composeFile: string): string | null {
  const ext = composeFile.endsWith(".yaml") ? ".yaml" : ".yml";
  const baseName = composeFile.replace(/\.(yaml|yml)$/, "");

  const overrideFile = `${baseName}.override${ext}`;

  if (existsSync(overrideFile)) {
    return overrideFile;
  }

  return null;
}

/**
 * Parse compose file and extract service names
 */
export function parseComposeFile(filePath: string): string[] {
  try {
    const content = readFileSync(filePath, "utf-8");
    const parsed = parseYaml(content);

    if (!parsed || typeof parsed !== "object" || !("services" in parsed)) {
      logger.error(`Invalid compose file: ${filePath} - missing 'services' key`);
      return [];
    }

    const services = parsed.services as Record<string, unknown>;
    return Object.keys(services);
  } catch (error) {
    logger.error(`Failed to parse compose file: ${filePath}`);
    logger.error(error);
    return [];
  }
}
