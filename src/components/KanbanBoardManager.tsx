import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KanbanColumn } from '@/types/leads';
import { X, Edit, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface KanbanBoardManagerProps {
  boards: KanbanColumn[];
  onAddBoard: (board: Omit<KanbanColumn, 'leads' | 'id'>) => Promise<any>;
  onUpdateBoard: (id: string, board: Partial<Omit<KanbanColumn, 'leads' | 'id'>>) => Promise<any>;
  onRemoveBoard: (id: string) => Promise<void>;
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
  onRemoveBoard 
}: KanbanBoardManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardColor, setNewBoardColor] = useState('blue');
  const [editingBoard, setEditingBoard] = useState<KanbanColumn | null>(null);
  const [editBoardTitle, setEditBoardTitle] = useState('');
  const [editBoardColor, setEditBoardColor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle adding a new board
  const handleAddBoard = async () => {
    if (!newBoardTitle.trim()) return;
    
    try {
      setIsSubmitting(true);
      await onAddBoard({
        title: newBoardTitle.trim(),
        color: newBoardColor
      });
      
      // Reset form and close dialog
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

  // Handle removing a board
  const handleRemoveBoard = async (id: string) => {
    if (confirm('Are you sure you want to remove this board? All leads in this board will be moved to the first board.')) {
      try {
        await onRemoveBoard(id);
      } catch (error) {
        console.error('Failed to remove board:', error);
      }
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-medium">Kanban Boards</h2>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              <span>Add Board</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Kanban Board</DialogTitle>
            </DialogHeader>
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
            <DialogFooter>
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
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {boards.map((board) => (
          <div 
            key={board.id} 
            className="flex items-center justify-between p-2 bg-muted/60 rounded-md"
          >
            <div className="flex items-center">
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
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-destructive" 
                onClick={() => handleRemoveBoard(board.id)}
                disabled={boards.length <= 1}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
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
    </div>
  );
}
