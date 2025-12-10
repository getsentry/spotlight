import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildDockerComposeCommand, parseExplicitDockerCompose } from "../docker-compose.ts";

// Mock the docker-compose-parser module
vi.mock("../docker-compose-parser.ts", () => ({
  findComposeFile: vi.fn(),
  findOverrideFile: vi.fn(),
  getComposeFilesFromEnv: vi.fn(),
  getDockerComposeServices: vi.fn(),
}));

// Import the mocked functions
import {
  findComposeFile,
  findOverrideFile,
  getComposeFilesFromEnv,
  getDockerComposeServices,
} from "../docker-compose-parser.ts";

describe("parseExplicitDockerCompose", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no COMPOSE_FILE env variable
    vi.mocked(getComposeFilesFromEnv).mockReturnValue(null);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("command detection", () => {
    it("should return null for non-docker commands", () => {
      expect(parseExplicitDockerCompose(["npm", "run", "dev"])).toBeNull();
      expect(parseExplicitDockerCompose(["node", "app.js"])).toBeNull();
      expect(parseExplicitDockerCompose(["pnpm", "dev"])).toBeNull();
    });

    it("should return null for commands with less than 2 arguments", () => {
      expect(parseExplicitDockerCompose([])).toBeNull();
      expect(parseExplicitDockerCompose(["docker"])).toBeNull();
    });

    it("should detect 'docker compose' command", () => {
      vi.mocked(findComposeFile).mockReturnValue("docker-compose.yml");
      vi.mocked(getDockerComposeServices).mockReturnValue(["web", "db"]);

      const result = parseExplicitDockerCompose(["docker", "compose", "up"]);

      expect(result).not.toBeNull();
      expect(result?.command).toEqual(["docker", "compose"]);
    });

    it("should detect 'docker-compose' command", () => {
      vi.mocked(findComposeFile).mockReturnValue("docker-compose.yml");
      vi.mocked(getDockerComposeServices).mockReturnValue(["web"]);

      const result = parseExplicitDockerCompose(["docker-compose", "up"]);

      expect(result).not.toBeNull();
      expect(result?.command).toEqual(["docker-compose"]);
    });
  });

  describe("subcommand support", () => {
    it("should pass through any subcommand and its args", () => {
      vi.mocked(findComposeFile).mockReturnValue("docker-compose.yml");
      vi.mocked(getDockerComposeServices).mockReturnValue(["app"]);

      expect(parseExplicitDockerCompose(["docker", "compose", "up", "-d"])?.subcommandArgs).toEqual(["up", "-d"]);
      expect(parseExplicitDockerCompose(["docker", "compose", "logs", "-f"])?.subcommandArgs).toEqual(["logs", "-f"]);
      expect(parseExplicitDockerCompose(["docker", "compose"])?.subcommandArgs).toEqual([]);
    });
  });

  describe("compose file detection", () => {
    it("should auto-detect compose file when no -f flag provided", () => {
      vi.mocked(findComposeFile).mockReturnValue("docker-compose.yml");
      vi.mocked(findOverrideFile).mockReturnValue(null);
      vi.mocked(getDockerComposeServices).mockReturnValue(["app"]);

      const result = parseExplicitDockerCompose(["docker", "compose", "up"]);

      expect(result).not.toBeNull();
      expect(result?.composeFiles).toEqual(["docker-compose.yml"]);
      expect(findComposeFile).toHaveBeenCalled();
    });

    it("should include override file when detected", () => {
      vi.mocked(findComposeFile).mockReturnValue("docker-compose.yml");
      vi.mocked(findOverrideFile).mockReturnValue("docker-compose.override.yml");
      vi.mocked(getDockerComposeServices).mockReturnValue(["app"]);

      const result = parseExplicitDockerCompose(["docker", "compose", "up"]);

      expect(result?.composeFiles).toEqual(["docker-compose.yml", "docker-compose.override.yml"]);
    });

    it("should return null when no compose file found", () => {
      vi.mocked(findComposeFile).mockReturnValue(null);

      const result = parseExplicitDockerCompose(["docker", "compose", "up"]);

      expect(result).toBeNull();
    });

    it("should use COMPOSE_FILE env when set", () => {
      vi.mocked(getComposeFilesFromEnv).mockReturnValue(["custom.yml", "custom.override.yml"]);
      vi.mocked(getDockerComposeServices).mockReturnValue(["service1"]);

      const result = parseExplicitDockerCompose(["docker", "compose", "up"]);

      expect(result?.composeFiles).toEqual(["custom.yml", "custom.override.yml"]);
      expect(findComposeFile).not.toHaveBeenCalled();
    });
  });

  describe("user-specified -f flags", () => {
    it("should extract -f flag with space separator", () => {
      vi.mocked(getDockerComposeServices).mockReturnValue(["web"]);

      const result = parseExplicitDockerCompose(["docker", "compose", "-f", "my-compose.yml", "up"]);

      expect(result?.composeFiles).toEqual(["my-compose.yml"]);
      expect(findComposeFile).not.toHaveBeenCalled();
    });

    it("should extract --file flag with space separator", () => {
      vi.mocked(getDockerComposeServices).mockReturnValue(["web"]);

      const result = parseExplicitDockerCompose(["docker", "compose", "--file", "custom.yml", "up"]);

      expect(result?.composeFiles).toEqual(["custom.yml"]);
    });

    it("should extract -f flag with = separator", () => {
      vi.mocked(getDockerComposeServices).mockReturnValue(["api"]);

      const result = parseExplicitDockerCompose(["docker", "compose", "-f=production.yml", "up"]);

      expect(result?.composeFiles).toEqual(["production.yml"]);
    });

    it("should extract --file flag with = separator", () => {
      vi.mocked(getDockerComposeServices).mockReturnValue(["db"]);

      const result = parseExplicitDockerCompose(["docker", "compose", "--file=staging.yml", "up"]);

      expect(result?.composeFiles).toEqual(["staging.yml"]);
    });

    it("should extract multiple -f flags", () => {
      vi.mocked(getDockerComposeServices).mockReturnValue(["web", "worker"]);

      const result = parseExplicitDockerCompose(["docker", "compose", "-f", "base.yml", "-f", "override.yml", "up"]);

      expect(result?.composeFiles).toEqual(["base.yml", "override.yml"]);
    });

    it("should handle mixed -f and --file flags", () => {
      vi.mocked(getDockerComposeServices).mockReturnValue(["svc"]);

      const result = parseExplicitDockerCompose([
        "docker-compose",
        "-f",
        "base.yml",
        "--file",
        "dev.yml",
        "-f=extra.yml",
        "up",
      ]);

      expect(result?.composeFiles).toEqual(["base.yml", "dev.yml", "extra.yml"]);
    });
  });

  describe("service extraction", () => {
    it("should extract services from compose files", () => {
      vi.mocked(findComposeFile).mockReturnValue("docker-compose.yml");
      vi.mocked(getDockerComposeServices).mockReturnValue(["web", "api", "db"]);

      const result = parseExplicitDockerCompose(["docker", "compose", "up"]);

      expect(result?.serviceNames).toEqual(["web", "api", "db"]);
    });

    it("should merge services from multiple compose files", () => {
      vi.mocked(getDockerComposeServices).mockImplementation((file: string) => {
        if (file === "base.yml") return ["web", "db"];
        if (file === "override.yml") return ["db", "redis"];
        return [];
      });

      const result = parseExplicitDockerCompose(["docker", "compose", "-f", "base.yml", "-f", "override.yml", "up"]);

      // Services should be deduplicated
      expect(result?.serviceNames).toContain("web");
      expect(result?.serviceNames).toContain("db");
      expect(result?.serviceNames).toContain("redis");
      expect(result?.serviceNames.length).toBe(3);
    });

    it("should return null when no services found", () => {
      vi.mocked(findComposeFile).mockReturnValue("docker-compose.yml");
      vi.mocked(getDockerComposeServices).mockReturnValue([]);

      const result = parseExplicitDockerCompose(["docker", "compose", "up"]);

      expect(result).toBeNull();
    });
  });

  describe("complex command scenarios", () => {
    it("should handle docker compose up with additional flags", () => {
      vi.mocked(findComposeFile).mockReturnValue("compose.yml");
      vi.mocked(getDockerComposeServices).mockReturnValue(["app"]);

      const result = parseExplicitDockerCompose(["docker", "compose", "up", "-d", "--build"]);

      expect(result).not.toBeNull();
      expect(result?.command).toEqual(["docker", "compose"]);
      expect(result?.subcommandArgs).toEqual(["up", "-d", "--build"]);
    });

    it("should handle docker compose up with service names", () => {
      vi.mocked(findComposeFile).mockReturnValue("compose.yml");
      vi.mocked(getDockerComposeServices).mockReturnValue(["web", "worker", "db"]);

      const result = parseExplicitDockerCompose(["docker", "compose", "up", "web", "worker"]);

      expect(result).not.toBeNull();
      expect(result?.subcommandArgs).toEqual(["up", "web", "worker"]);
    });

    it("should handle docker compose up with flags and service names combined", () => {
      vi.mocked(findComposeFile).mockReturnValue("compose.yml");
      vi.mocked(getDockerComposeServices).mockReturnValue(["web", "worker", "db"]);

      const result = parseExplicitDockerCompose(["docker", "compose", "up", "-d", "--build", "web", "worker"]);

      expect(result).not.toBeNull();
      expect(result?.subcommandArgs).toEqual(["up", "-d", "--build", "web", "worker"]);
    });

    it("should handle docker-compose with project name flag", () => {
      vi.mocked(findComposeFile).mockReturnValue("docker-compose.yml");
      vi.mocked(getDockerComposeServices).mockReturnValue(["svc"]);

      // -p flag passes through to subcommandArgs (we only extract -f flags)
      const result = parseExplicitDockerCompose(["docker-compose", "-p", "myproject", "up"]);

      expect(result).not.toBeNull();
      // -p and its value pass through since we only care about -f flags
      expect(result?.subcommandArgs).toEqual(["-p", "myproject", "up"]);
      // Should auto-detect since no -f was provided
      expect(findComposeFile).toHaveBeenCalled();
    });

    it("should extract -f flags and pass through other flags", () => {
      vi.mocked(getDockerComposeServices).mockReturnValue(["app"]);

      const result = parseExplicitDockerCompose([
        "docker",
        "compose",
        "-f",
        "custom.yml",
        "-p",
        "myproject",
        "up",
        "-d",
      ]);

      expect(result).not.toBeNull();
      expect(result?.composeFiles).toEqual(["custom.yml"]);
      // -p and its value pass through along with the subcommand
      expect(result?.subcommandArgs).toEqual(["-p", "myproject", "up", "-d"]);
    });
  });
});

describe("buildDockerComposeCommand", () => {
  it("should include subcommandArgs in the final command", () => {
    const config = {
      composeFiles: ["docker-compose.yml"],
      command: ["docker", "compose"],
      serviceNames: ["web", "db"],
      subcommandArgs: ["up", "-d", "--build"],
    };

    const result = buildDockerComposeCommand(config);

    // Should end with: up -d --build
    expect(result.cmdArgs).toContain("up");
    const upIndex = result.cmdArgs.indexOf("up");
    expect(result.cmdArgs.slice(upIndex)).toEqual(["up", "-d", "--build"]);
  });

  it("should include service names from subcommandArgs in the final command", () => {
    const config = {
      composeFiles: ["docker-compose.yml"],
      command: ["docker", "compose"],
      serviceNames: ["web", "worker", "db"],
      subcommandArgs: ["up", "-d", "web", "worker"],
    };

    const result = buildDockerComposeCommand(config);

    const upIndex = result.cmdArgs.indexOf("up");
    expect(result.cmdArgs.slice(upIndex)).toEqual(["up", "-d", "web", "worker"]);
  });

  it("should work with empty subcommandArgs", () => {
    const config = {
      composeFiles: ["docker-compose.yml"],
      command: ["docker", "compose"],
      serviceNames: ["app"],
      subcommandArgs: [],
    };

    const result = buildDockerComposeCommand(config);

    // Should end with -f - (no subcommand)
    expect(result.cmdArgs[result.cmdArgs.length - 1]).toEqual("-");
  });

  it("should build complete command with compose files and subcommandArgs", () => {
    const config = {
      composeFiles: ["base.yml", "override.yml"],
      command: ["docker-compose"],
      serviceNames: ["api"],
      subcommandArgs: ["up", "-d", "--build", "--force-recreate"],
    };

    const result = buildDockerComposeCommand(config);

    expect(result.cmdArgs).toEqual([
      "docker-compose",
      "-f",
      "base.yml",
      "-f",
      "override.yml",
      "-f",
      "-",
      "up",
      "-d",
      "--build",
      "--force-recreate",
    ]);
  });

  it("should support non-up subcommands", () => {
    const config = {
      composeFiles: ["docker-compose.yml"],
      command: ["docker", "compose"],
      serviceNames: ["web"],
      subcommandArgs: ["logs", "-f", "web"],
    };

    const result = buildDockerComposeCommand(config);

    expect(result.cmdArgs).toEqual(["docker", "compose", "-f", "docker-compose.yml", "-f", "-", "logs", "-f", "web"]);
  });

  it("should support exec subcommand", () => {
    const config = {
      composeFiles: ["docker-compose.yml"],
      command: ["docker", "compose"],
      serviceNames: ["web"],
      subcommandArgs: ["exec", "web", "bash"],
    };

    const result = buildDockerComposeCommand(config);

    expect(result.cmdArgs).toEqual(["docker", "compose", "-f", "docker-compose.yml", "-f", "-", "exec", "web", "bash"]);
  });
});
