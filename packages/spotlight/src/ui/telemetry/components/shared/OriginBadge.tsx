import { Badge } from "@spotlight/ui/ui/badge";

type SourceType = "browser" | "server" | "mobile";

type OriginBadgeProps = {
  sourceType: SourceType | undefined;
};

const SOURCE_CONFIG: Record<SourceType, { label: string; className: string; title: string }> = {
  browser: {
    label: "Browser",
    // Yellow matching terminal output (#FDB81B)
    className: "bg-yellow-500/20 text-yellow-200 border-yellow-500/30",
    title: "This event originated from a browser",
  },
  server: {
    label: "Server",
    // Magenta matching terminal output (#FF45A8)
    className: "bg-pink-500/20 text-pink-200 border-pink-500/30",
    title: "This event originated from a server",
  },
  mobile: {
    label: "Mobile",
    // Blue matching terminal output (#226DFC)
    className: "bg-blue-500/20 text-blue-200 border-blue-500/30",
    title: "This event originated from a mobile device",
  },
};

export function OriginBadge({ sourceType }: OriginBadgeProps) {
  if (!sourceType) {
    return null;
  }

  const config = SOURCE_CONFIG[sourceType];

  return (
    <Badge title={config.title} className={config.className}>
      {config.label}
    </Badge>
  );
}
