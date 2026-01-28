import { cn } from "@/lib/utils";

interface PropDefinition {
  name: string;
  type: string;
  default?: string;
  description: string;
  required?: boolean;
}

interface APITableProps {
  props: PropDefinition[];
  className?: string;
}

export function APITable({ props, className }: APITableProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-3 px-4 text-left font-medium">Prop</th>
            <th className="py-3 px-4 text-left font-medium">Type</th>
            <th className="py-3 px-4 text-left font-medium">Default</th>
            <th className="py-3 px-4 text-left font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {props.map(prop => (
            <tr key={prop.name} className="border-b">
              <td className="py-3 px-4">
                <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">
                  {prop.name}
                  {prop.required && <span className="text-destructive ml-0.5">*</span>}
                </code>
              </td>
              <td className="py-3 px-4">
                <code className="text-sm font-mono text-muted-foreground">{prop.type}</code>
              </td>
              <td className="py-3 px-4">
                {prop.default ? (
                  <code className="text-sm font-mono text-muted-foreground">{prop.default}</code>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="py-3 px-4 text-muted-foreground">{prop.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default APITable;
