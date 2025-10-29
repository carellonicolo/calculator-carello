import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StudentGuide } from "@/components/help/StudentGuide";
import { TeacherGuide } from "@/components/help/TeacherGuide";
import { GraduationCap, UserCog } from "lucide-react";

interface HelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "students" | "teachers";
}

export const HelpModal = ({ open, onOpenChange, defaultTab = "students" }: HelpModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <span className="text-3xl">📚</span>
            Guida alla Calcolatrice
          </DialogTitle>
          <DialogDescription>
            Tutto quello che ti serve sapere per usare al meglio la calcolatrice
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue={defaultTab} className="w-full">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="students" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Per Studenti
              </TabsTrigger>
              <TabsTrigger value="teachers" className="gap-2">
                <UserCog className="h-4 w-4" />
                Per Insegnanti
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[calc(85vh-180px)]">
            <TabsContent value="students" className="px-6 pb-6 mt-0">
              <StudentGuide />
            </TabsContent>
            
            <TabsContent value="teachers" className="px-6 pb-6 mt-0">
              <TeacherGuide />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
