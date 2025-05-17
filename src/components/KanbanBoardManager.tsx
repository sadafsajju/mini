import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { KanbanColumn } from '@/types/leads';
import { X, Plus, Pencil, GripVertical } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface KanbanBoardManagerProps {
  boards: KanbanColumn[];
  onAddBoard: (board: Omit<KanbanColumn, 'leads' | 'id'>) => Promise<KanbanColumn>;
  onUpdateBoard: (id: string, board: Partial<Omit<KanbanColumn, 'leads' | 'id'>>) => Promise<KanbanColumn>;
  onRemoveBoard: (id: string) => Promise<void>;
  onReorderBoards?: (boards: KanbanColumn[]) => Promise<void>;
}

// Available colors for Kanban boards
const availableColors = [
  { name: 'Blue', value: 'blue' },
  { name: 'Yellow', value: 'yellow' },
  { name: 'Green', value: 'green' },
  { name: 'Purple', value: 'purple' },
  { name: 'Gray', value: 'gray' },
  { name: 'Red', value: 'red' },
];

export default function KanbanBoardManager({ 
  boards, 
  onAddBoard, 
  onUpdateBoard, 
  onRemoveBoard,
  onReorderBoards 
}: KanbanBoardManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardColor, setNewBoardColor] = useState('blue');
  const [editingBoard, setEditingBoard] = useState<KanbanColumn | null>(null);
  const [editBoardTitle, setEditBoardTitle] = useState('');
  const [editBoardColor, setEditBoardColor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggedBoardId, setDraggedBoardId] = useState<string | null>(null);

  // Handle adding a new board
  const handleAddBoard = async () => {
    if (!newBoardTitle.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      // Create the new board data
      const newBoardData = {
        title: newBoardTitle.trim(),
        color: newBoardColor
      };
      
      // Add the board to the database
      await onAddBoard(newBoardData);
      
      // Reset form and close sheet
      setNewBoardTitle('');
      setNewBoardColor('blue');
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to add board:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit dialog for a board
  const openEditDialog = (board: KanbanColumn) => {
    setEditingBoard(board);
    setEditBoardTitle(board.title);
    setEditBoardColor(board.color);
    setIsEditDialogOpen(true);
  };

  // Handle updating a board
  const handleUpdateBoard = async () => {
    if (!editingBoard || !editBoardTitle.trim()) return;
    
    try {
      setIsSubmitting(true);
      await onUpdateBoard(editingBoard.id, {
        title: editBoardTitle.trim(),
        color: editBoardColor
      });
      
      // Reset form and close dialog
      setEditingBoard(null);
      setEditBoardTitle('');
      setEditBoardColor('');
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update board:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (id: string) => {
    setBoardToDelete(id);
    setIsDeleteAlertOpen(true);
  };

  // Handle removing a board
  const handleRemoveBoard = async () => {
    if (!boardToDelete) return;
    
    try {
      setIsSubmitting(true);
      await onRemoveBoard(boardToDelete);
      setIsDeleteAlertOpen(false);
      setBoardToDelete(null);
    } catch (error) {
      console.error('Failed to remove board:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle starting drag
  const handleDragStart = (id: string) => {
    setDraggedBoardId(id);
  };

  // Handle dropping
  const handleDrop = useCallback((dropTargetId: string) => {
    if (draggedBoardId !== null && draggedBoardId !== dropTargetId && onReorderBoards) {
      const draggedIndex = boards.findIndex(board => board.id === draggedBoardId);
      const dropIndex = boards.findIndex(board => board.id === dropTargetId);
      
      if (draggedIndex !== -1 && dropIndex !== -1) {
        // Create a new array with the reordered boards
        const reorderedBoards = [...boards];
        const [draggedBoard] = reorderedBoards.splice(draggedIndex, 1);
        reorderedBoards.splice(dropIndex, 0, draggedBoard);
        
        // Reset drag state
        setDraggedBoardId(null);
        
        // Call the reorder function
        onReorderBoards(reorderedBoards).catch(error => {
          console.error('Failed to reorder boards:', error);
        });
      }
    }
  }, [boards, draggedBoardId, onReorderBoards]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault(); // Allow dropping by preventing default
    // Add a visual indicator for the drop target
    if (draggedBoardId !== null && draggedBoardId !== id) {
      e.currentTarget.classList.add('border-2', 'border-primary', 'border-dashed');
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Remove the visual indicator when dragging out
    e.currentTarget.classList.remove('border-2', 'border-primary', 'border-dashed');
  };

  return (
    <div>
      <Sheet open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Add New Kanban Board</SheetTitle>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Board Title</Label>
                <Input
                  id="title"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  placeholder="e.g., In Progress"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color">Board Color</Label>
                <Select value={newBoardColor} onValueChange={setNewBoardColor}>
                  <SelectTrigger id="color">
                    <SelectValue placeholder="Select a color" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColors.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full bg-${color.value}-500 mr-2`}></div>
                          {color.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SheetFooter className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddBoard}
                disabled={!newBoardTitle.trim() || isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Board'}
              </Button>
            </SheetFooter>
          </SheetContent>
      </Sheet>

      <div className="grid grid-cols-1 gap-3">
        {boards.map((board) => (
          <div 
            key={board.id} 
            className={`flex items-center justify-between px-4 py-2 bg-muted/60 rounded-xl ${
              draggedBoardId === board.id ? 'opacity-50' : ''
            }`}
            draggable={!!onReorderBoards}
            onDragStart={() => handleDragStart(board.id)}
            onDragOver={(e) => handleDragOver(e, board.id)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(board.id)}
          >
            <div className="flex items-center">
              {onReorderBoards && (
                <div 
                  className="cursor-grab mr-2 hover:text-primary" 
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <GripVertical className="h-4 w-4" />
                </div>
              )}
              <div className={`w-3 h-3 rounded-full bg-${board.color}-500 mr-2`}></div>
              <span>{board.title}</span>
              <span className="ml-2 text-xs text-muted-foreground">({board.leads.length})</span>
            </div>
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => openEditDialog(board)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-destructive" 
                onClick={() => openDeleteDialog(board.id)}
                disabled={boards.length <= 1}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1 mt-2"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span>Add Board</span>
        </Button>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Kanban Board</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Board Title</Label>
              <Input
                id="edit-title"
                value={editBoardTitle}
                onChange={(e) => setEditBoardTitle(e.target.value)}
                placeholder="e.g., In Progress"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-color">Board Color</Label>
              <Select value={editBoardColor} onValueChange={setEditBoardColor}>
                <SelectTrigger id="edit-color">
                  <SelectValue placeholder="Select a color" />
                </SelectTrigger>
                <SelectContent>
                  {availableColors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full bg-${color.value}-500 mr-2`}></div>
                        {color.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateBoard}
              disabled={!editBoardTitle.trim() || isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Board'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the kanban board. All leads in this board will be moved to the first board.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveBoard} 
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}