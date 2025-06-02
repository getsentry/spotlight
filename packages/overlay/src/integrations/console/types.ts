export type ConsoleMessage = {
  type: Level;
  args: string[];
  msg: string;
  sessionId: string;
};

export type Level = "log" | "warn" | "error";
