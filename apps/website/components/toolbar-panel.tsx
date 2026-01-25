"use client";

interface ToolbarPanelProps {
  selectedTool: "cursor" | "circle" | "polygon" | "line";
  onToolChange: (tool: "cursor" | "circle" | "polygon" | "line") => void;
}

const tools = [
  { id: "cursor", label: "Cursor", icon: "→" },
  { id: "circle", label: "Circle", icon: "●" },
  { id: "polygon", label: "Polygon", icon: "⬟" },
  { id: "line", label: "Line", icon: "/" },
];

export default function ToolbarPanel({
  selectedTool,
  onToolChange,
}: ToolbarPanelProps) {
  return (
    <div className="h-16 border-b border-border bg-card flex items-center justify-center gap-2 px-4">
      <div className="flex items-center gap-1 bg-background rounded p-1">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() =>
              onToolChange(tool.id as "cursor" | "circle" | "polygon" | "line")
            }
            className={`w-10 h-10 flex items-center justify-center rounded text-lg font-semibold transition-colors ${
              selectedTool === tool.id
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-card"
            }`}
            title={tool.label}
          >
            {tool.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
