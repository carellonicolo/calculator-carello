import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMode: string;
}

export const KeyboardShortcutsModal = ({ open, onOpenChange, currentMode }: KeyboardShortcutsModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use your physical keyboard to calculate faster
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={currentMode} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="standard">Standard</TabsTrigger>
            <TabsTrigger value="scientific">Scientific</TabsTrigger>
            <TabsTrigger value="programmer">Programmer</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            {/* Standard Calculator Shortcuts */}
            <TabsContent value="standard" className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-3 text-primary">Numbers & Decimal</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><kbd className="px-2 py-1 bg-muted rounded">0-9</kbd> Input digits</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">.</kbd> Decimal point</div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3 text-primary">Operations</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><kbd className="px-2 py-1 bg-muted rounded">+</kbd> Addition</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">-</kbd> Subtraction</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">*</kbd> Multiplication</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">/</kbd> Division</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">Enter</kbd> Equals (=)</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">%</kbd> Percentage</div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3 text-primary">Control</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><kbd className="px-2 py-1 bg-muted rounded">Esc</kbd> Clear (C)</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">Delete</kbd> Clear Entry (CE)</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">Backspace</kbd> Delete last char</div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3 text-primary">Memory</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><kbd className="px-2 py-1 bg-muted rounded">Ctrl+M</kbd> Memory Store (MS)</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">Ctrl+R</kbd> Memory Recall (MR)</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">Ctrl+P</kbd> Memory Add (M+)</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">Ctrl+Q</kbd> Memory Subtract (M-)</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">Ctrl+L</kbd> Memory Clear (MC)</div>
                </div>
              </Card>
            </TabsContent>

            {/* Scientific Calculator Shortcuts */}
            <TabsContent value="scientific" className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-3 text-primary">Basic Operations</h3>
                <div className="text-sm text-muted-foreground">
                  All Standard calculator shortcuts apply, plus:
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3 text-primary">Constants</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><kbd className="px-2 py-1 bg-muted rounded">P</kbd> π (pi)</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">E</kbd> e (Euler's number)</div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3 text-primary">Trigonometric</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><kbd className="px-2 py-1 bg-muted rounded">S</kbd> sin</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">C</kbd> cos</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">T</kbd> tan</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">Shift+S</kbd> sin⁻¹</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">Shift+C</kbd> cos⁻¹</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">Shift+T</kbd> tan⁻¹</div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3 text-primary">Hyperbolic</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><kbd className="px-2 py-1 bg-muted rounded">H</kbd> sinh</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">Shift+H</kbd> cosh</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">Y</kbd> tanh</div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3 text-primary">Powers & Roots</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><kbd className="px-2 py-1 bg-muted rounded">Q</kbd> √ (square root)</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">R</kbd> x²</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">Shift+R</kbd> x³</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">^</kbd> xʸ</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">!</kbd> n! (factorial)</div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3 text-primary">Logarithms</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><kbd className="px-2 py-1 bg-muted rounded">L</kbd> log (base 10)</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">N</kbd> ln (natural log)</div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3 text-primary">Other</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><kbd className="px-2 py-1 bg-muted rounded">M</kbd> mod</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">Alt+D</kbd> Toggle DEG/RAD</div>
                </div>
              </Card>
            </TabsContent>

            {/* Programmer Calculator Shortcuts */}
            <TabsContent value="programmer" className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-3 text-primary">Number Input</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><kbd className="px-2 py-1 bg-muted rounded">0-9</kbd> Decimal digits</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">A-F</kbd> Hex digits (HEX mode only)</div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3 text-primary">Bitwise Operations</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><kbd className="px-2 py-1 bg-muted rounded">&</kbd> AND</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">|</kbd> OR</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">X</kbd> XOR</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">~</kbd> NOT</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">&lt;</kbd> Left Shift (&lt;&lt;)</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">&gt;</kbd> Right Shift (&gt;&gt;)</div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3 text-primary">Base Conversions</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><kbd className="px-2 py-1 bg-muted rounded">Ctrl+H</kbd> HEX (base 16)</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">Ctrl+D</kbd> DEC (base 10)</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">Ctrl+O</kbd> OCT (base 8)</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">Ctrl+B</kbd> BIN (base 2)</div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3 text-primary">Word Size</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><kbd className="px-2 py-1 bg-muted rounded">Ctrl+1</kbd> BYTE (8-bit)</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">Ctrl+2</kbd> WORD (16-bit)</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">Ctrl+3</kbd> DWORD (32-bit)</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">Ctrl+4</kbd> QWORD (64-bit)</div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3 text-primary">Arithmetic</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><kbd className="px-2 py-1 bg-muted rounded">+</kbd> Addition</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">-</kbd> Subtraction</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">*</kbd> Multiplication</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">/</kbd> Division</div>
                  <div><kbd className="px-2 py-1 bg-muted rounded">M</kbd> MOD</div>
                </div>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          💡 Tip: Shortcuts respect admin settings. Disabled functions won't respond to keyboard input.
        </div>
      </DialogContent>
    </Dialog>
  );
};
