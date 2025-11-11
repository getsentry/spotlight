import { readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import { logger } from "../logger.js";

const COMPOSE_FILE_BASE_NAMES = ["docker-compose", "compose"] as const;
const COMPOSE_FILE_EXTENSIONS = [".yaml", ".yml"] as const;

/**
 * Find a file by trying to read all combinations of base names and extensions.
 * This saves an I/O operation by skipping existsSync and directly attempting to read.
 */
function findFile(buildFileName: (baseName: string, ext: string) => string): string | null {
  for (const baseName of COMPOSE_FILE_BASE_NAMES) {
    for (const ext of COMPOSE_FILE_EXTENSIONS) {
      const fileName = buildFileName(baseName, ext);
      try {
        readFileSync(fileName);
        return fileName;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          continue;
        }
        logger.error(`Error checking file ${fileName}: ${error}`);
      }
    }
  }
  return null;
}

/**
 * Find the compose file in the current directory
 */
export function findComposeFile(): string | null {
  return findFile((baseName, ext) => `${baseName}${ext}`);
}

/**
 * Find the override file in the current directory
 */
export function findOverrideFile(): string | null {
  return findFile((baseName, ext) => `${baseName}.override${ext}`);
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
