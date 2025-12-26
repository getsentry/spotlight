import { constants, accessSync, readFileSync } from "node:fs";
import { delimiter } from "node:path";
import { parse as parseYaml } from "yaml";
import { logger } from "../logger.ts";

const COMPOSE_FILE_BASE_NAMES = ["docker-compose", "compose"] as const;
const COMPOSE_FILE_EXTENSIONS = [".yml", ".yaml"] as const;

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
    .filter(Boolean);

  return files.length > 0 ? files : null;
}

/**
 * Find the compose file in the current directory by trying all combinations
 * of base names and extensions.
 */
export function findComposeFile(): string | null {
  for (const baseName of COMPOSE_FILE_BASE_NAMES) {
    for (const ext of COMPOSE_FILE_EXTENSIONS) {
      const fileName = `${baseName}${ext}`;
      try {
        accessSync(fileName, constants.R_OK);
        return fileName;
      } catch {
        // File doesn't exist or isn't readable, continue searching
      }
    }
  }
  return null;
}

/**
 * Find the override file for a given compose file.
 * Docker Compose looks for an override file with the same base name and extension.
 * For example: docker-compose.yml -> docker-compose.override.yml
 */
export function findOverrideFile(composeFile: string): string | null {
  // Extract extension from the original file to maintain consistency
  const ext = composeFile.endsWith(".yaml") ? ".yaml" : ".yml";
  const baseName = composeFile.replace(/\.(yaml|yml)$/, "");
  const overrideFile = `${baseName}.override${ext}`;

  try {
    accessSync(overrideFile, constants.R_OK);
    return overrideFile;
  } catch {
    // File doesn't exist or isn't readable
    return null;
  }
}

/**
 * Parse compose file and extract service names
 */
export function getDockerComposeServices(filePath: string): string[] {
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
