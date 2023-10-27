export type ConsoleMessage = {
  type: Levels;
  args: string[];
  msg: string;
  sessionId: string;
};

export type Levels = "log" | "warn";
