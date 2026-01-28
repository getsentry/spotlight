import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
      >
        <title>Spotlight Logo</title>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" fill="currentColor" />
        <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="font-semibold text-lg">Spotlight UI</span>
    </div>
  );
}

export default Logo;
