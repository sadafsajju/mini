// This component is not used directly in a client entry file

import React from 'react';
import { KanbanColumn } from '@/types/leads';
import KanbanBoardManager from './KanbanBoardManager';
import { 
  Sheet, 
  SheetTrigger, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';

interface KanbanBoardManagerSheetProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  boards: KanbanColumn[];
  onAddBoard: (board: Omit<KanbanColumn, 'leads' | 'id'>) => Promise<any>;
  onUpdateBoard: (id: string, board: Partial<Omit<KanbanColumn, 'leads' | 'id'>>) => Promise<any>;
  onRemoveBoard: (id: string) => Promise<void>;
  trigger?: React.ReactNode;
}

export default function KanbanBoardManagerSheet({
  isOpen,
  onOpenChange,
  boards,
  onAddBoard,
  onUpdateBoard,
  onRemoveBoard,
  trigger
}: KanbanBoardManagerSheetProps) {
  const [open, setOpen] = React.useState(false);

  // Sync with external state
  React.useEffect(() => {
    if (isOpen !== undefined) {
      setOpen(isOpen);
    }
  }, [isOpen]);

  // Handle internal state change and propagate to parent if needed
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Manage Kanban Boards</SheetTitle>
          <SheetDescription>
            Add, edit, or remove kanban boards to organize your leads.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4">
          <KanbanBoardManager
            boards={boards}
            onAddBoard={onAddBoard}
            onUpdateBoard={onUpdateBoard}
            onRemoveBoard={onRemoveBoard}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
