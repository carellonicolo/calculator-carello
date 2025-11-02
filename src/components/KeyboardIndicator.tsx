import { Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KeyboardIndicatorProps {
  onClick: () => void;
}

export const KeyboardIndicator = ({ onClick }: KeyboardIndicatorProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
    >
      <Keyboard className="h-3 w-3" />
      <span>Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">?</kbd> for shortcuts</span>
    </Button>
  );
};
