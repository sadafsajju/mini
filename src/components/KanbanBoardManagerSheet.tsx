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
  onAddBoard: (board: Omit<KanbanColumn, 'leads' | 'id'>) => Promise<KanbanColumn>;
  onUpdateBoard: (id: string, board: Partial<Omit<KanbanColumn, 'leads' | 'id'>>) => Promise<KanbanColumn>;
  onRemoveBoard: (id: string) => Promise<void>;
  onReorderBoards?: (boards: KanbanColumn[]) => Promise<void>;
  trigger?: React.ReactNode;
}

export default function KanbanBoardManagerSheet({
  isOpen,
  onOpenChange,
  boards,
  onAddBoard,
  onUpdateBoard,
  onRemoveBoard,
  onReorderBoards,
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

  // Wrapped callbacks to ensure UI updates immediately
  const handleAddBoard = async (board: Omit<KanbanColumn, 'leads' | 'id'>) => {
    const result = await onAddBoard(board);
    return result;
  };

  const handleUpdateBoard = async (id: string, board: Partial<Omit<KanbanColumn, 'leads' | 'id'>>) => {
    const result = await onUpdateBoard(id, board);
    return result;
  };

  const handleRemoveBoard = async (id: string) => {
    await onRemoveBoard(id);
  };

  const handleReorderBoards = async (reorderedBoards: KanbanColumn[]) => {
    if (onReorderBoards) {
      await onReorderBoards(reorderedBoards);
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
            onAddBoard={handleAddBoard}
            onUpdateBoard={handleUpdateBoard}
            onRemoveBoard={handleRemoveBoard}
            onReorderBoards={onReorderBoards ? handleReorderBoards : undefined}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}