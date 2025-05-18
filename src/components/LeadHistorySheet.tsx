import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger
} from '@/components/ui/sheet';
import { Lead } from '@/types/leads';
import KanbanCardHistory from './KanbanCardHistory';

interface LeadHistorySheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  trigger?: React.ReactNode;
}

export default function LeadHistorySheet({ 
  isOpen, 
  onOpenChange, 
  lead,
  trigger 
}: LeadHistorySheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent side="right" className="overflow-y-auto w-full sm:max-w-md">
        <SheetHeader className="mb-4">
          <SheetTitle>Card Movement Timeline</SheetTitle>
          <SheetDescription>
            Complete history for &quot;{lead.name}&quot;
          </SheetDescription>
        </SheetHeader>
        <KanbanCardHistory leadId={lead.id} />
      </SheetContent>
    </Sheet>
  );
}
