import { cn } from "@spotlight/ui/lib/cn";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@spotlight/ui/ui/empty";

export type EmptyStateProps = {
  title?: string;
  description: string;
  children?: React.ReactNode;
  variant?: "simple" | "full";
  className?: string;
  showDocsLink?: boolean;
};

const DOCS_LINK = (
  <a
    href="https://spotlightjs.com/docs/getting-started/"
    target="_blank"
    rel="noopener noreferrer"
    className="underline hover:text-primary-400"
  >
    Spotlight Docs
  </a>
);

export default function EmptyState({
  title,
  description,
  children,
  variant = "simple",
  className,
  showDocsLink = false,
}: EmptyStateProps) {
  if (variant === "simple") {
    return <p className={cn("text-primary-300 px-6 py-4", className)}>{description}</p>;
  }

  const content = showDocsLink ? (
    children ? (
      <>
        {children}
        {DOCS_LINK}
      </>
    ) : (
      DOCS_LINK
    )
  ) : (
    children
  );

  return (
    <Empty className={className}>
      <EmptyHeader>
        {title && <EmptyTitle>{title}</EmptyTitle>}
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {content && <EmptyContent>{content}</EmptyContent>}
    </Empty>
  );
}
