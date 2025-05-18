import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lead, KanbanColumn } from '@/types/leads';
import { Pencil, Flag, History, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateLead } from '@/lib/api/leads';
import { useLeadDelete } from './LeadDeleteProvider';
import LeadHistorySheet from './LeadHistorySheet';
import KanbanCardMoveDialog from './KanbanCardMoveDialog';
import { createCardMovementHistory } from '@/lib/api/kanbanCardHistory';

interface LeadCardProps {
  lead: Lead;
  onEdit?: (id: number) => void;
  onContact?: (id: number) => void;
  onLeadUpdate?: (updatedLead: Lead) => void;
  boardTitle?: string;
  boardColor?: string;
  boards?: KanbanColumn[];
}

// Function to get priority color class based on priority level
const getPriorityColorClass = (priority: string | null | undefined) => {
  if (!priority) return '';
  
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'low':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    default:
      return '';
  }
};

const LeadCard: React.FC<LeadCardProps> = ({ lead, onEdit, onLeadUpdate, boardTitle, boardColor = 'blue', boards = [] }) => {
  const { openDeleteDialog } = useLeadDelete();
  const [status, setStatus] = useState<string | undefined>(lead.status);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [currentBoardTitle, setCurrentBoardTitle] = useState<string | undefined>(boardTitle);
  const [currentBoardColor, setCurrentBoardColor] = useState<string | undefined>(boardColor);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    newStatus: string;
    oldStatus: string | undefined;
    fromTitle: string | undefined;
    toTitle: string | undefined;
  } | null>(null);

  // Always update status and board title/color
  useEffect(() => {
    setStatus(lead.status);
    
    // Find the current board to get its title and color
    if (lead.status && boards.length > 0) {
      const currentBoard = boards.find(board => board.id === lead.status);
      if (currentBoard) {
        setCurrentBoardTitle(currentBoard.title);
        setCurrentBoardColor(currentBoard.color);
      } else {
        setCurrentBoardTitle(boardTitle);
        setCurrentBoardColor(boardColor);
      }
    } else {
      setCurrentBoardTitle(boardTitle);
      setCurrentBoardColor(boardColor);
    }
  }, [lead.status, boardTitle, boardColor, boards]);
  
  const formattedDate = lead.created_at 
    ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })
    : '';

  // Handle status/board change
  const handleStatusChange = (newStatus: string) => {
    if (newStatus === status) return;
    
    // Find the new board to get its title
    const newBoard = boards.find(board => board.id === newStatus);
    // Find the current board
    const currentBoard = boards.find(board => board.id === status);
    
    // Set the pending status change
    setPendingStatusChange({
      newStatus,
      oldStatus: status,
      fromTitle: currentBoard?.title,
      toTitle: newBoard?.title
    });
    
    // Open the move dialog
    setMoveDialogOpen(true);
  };
  
  // Handle actual status change after notes are entered
  const handleMoveWithNotes = async (notes: string) => {
    if (!pendingStatusChange) return;
    
    const { newStatus, oldStatus } = pendingStatusChange;
    
    try {
      setIsStatusUpdating(true);
      
      // Find the new board to get its title and color
      const newBoard = boards.find(board => board.id === newStatus);
      
      // Update local state immediately for better UX
      setStatus(newStatus);
      if (newBoard) {
        setCurrentBoardTitle(newBoard.title);
        setCurrentBoardColor(newBoard.color);
      }
      
      // Update the lead in the database
      const updatedLead = await updateLead(lead.id, { 
        status: newStatus 
      });
      
      // Create history entry for the movement with notes
      if (oldStatus) {
        await createCardMovementHistory(
          lead.id,
          oldStatus,
          newStatus,
          notes,
          pendingStatusChange.fromTitle,
          pendingStatusChange.toTitle
        );
      }
      
      // Notify parent component about the update
      if (onLeadUpdate) {
        onLeadUpdate(updatedLead);
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      // Revert to original status if update fails
      setStatus(oldStatus);
      setCurrentBoardTitle(boardTitle);
      setCurrentBoardColor(boardColor);
    } finally {
      setIsStatusUpdating(false);
      setPendingStatusChange(null);
    }
  };
  
  // Handle dialog close without saving
  const handleCancelMove = () => {
    setMoveDialogOpen(false);
    setPendingStatusChange(null);
  };
  
  return (
    <Card className="flex-end mb-3 shadow-none border bg-card dark:bg-card/80 dark:border-muted/20 rounded-xl hover:shadow-md transition-shadow group relative">

      <div className='absolute right-4 top-4 flex justify-end gap-2 items-center'>
        <TooltipProvider>
          {/* Edit button tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onEdit && onEdit(lead.id)}
                className="h-7 w-7 p-0 opacity-0 bg-blue-800/10 hover:bg-blue-800/30 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit</p>
            </TooltipContent>
          </Tooltip>
          
          {/* History button tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setHistoryDialogOpen(true)}
                className="h-7 w-7 p-0 opacity-0 bg-blue-800/10 hover:bg-blue-800/30 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                <History className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View History</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Delete button tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => openDeleteDialog(lead)}
                className="h-7 w-7 p-0 opacity-0 bg-red-800/10 hover:bg-red-800/30 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* History Sheet */}
      <LeadHistorySheet
        isOpen={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        lead={lead}
      />
      
      {/* Movement Notes Dialog */}
      <KanbanCardMoveDialog
        isOpen={moveDialogOpen}
        onClose={handleCancelMove}
        lead={lead}
        fromColumn={pendingStatusChange?.fromTitle || ''}
        toColumn={pendingStatusChange?.toTitle || ''}
        onSave={handleMoveWithNotes}
      />
      <CardHeader className="p-3 pb-0">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-normal capitalize">{lead.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-2 pb-2">
        <div className="flex items-center text-sm text-muted-foreground mb-1">
            {lead.email}
        </div>
        {lead.phone_number && (
          <div className="flex items-center text-sm text-muted-foreground">
            <span>{lead.phone_number}</span>
          </div>
        )}

        <div className="mt-2 text-sm border-t border-border/50 dark:border-muted/20 pt-2 text-muted-foreground line-clamp-2">
          <CardDescription className="flex items-center justify-between text-xs py-2 px-2">
            <span>{formattedDate}</span>
            <div className='flex gap-2'>
            {/* Priority Flag */}
            {lead.priority && (
              <Badge className={`px-2 py-0 h-6 ${getPriorityColorClass(lead.priority)}`}>
                <div className="flex items-center gap-1">
                  <Flag className="h-3 w-3 mr-1" />
                  <span className="capitalize">{lead.priority}</span>
                </div>
              </Badge>
            )}
            {/* Status/Board Dropdown */}
            {boards && boards.length > 0 && (
              <Select
                value={status}
                onValueChange={handleStatusChange}
                disabled={isStatusUpdating}
              >
                <SelectTrigger 
                  className={`w-24 h-6 px-2 text-xs border-none bg-${currentBoardColor || boardColor}-100 text-${currentBoardColor || boardColor}-800 dark:bg-${currentBoardColor || boardColor}-900/30 dark:text-${currentBoardColor || boardColor}-400`}
                >
                  <SelectValue placeholder="Set status">
                    {currentBoardTitle || boardTitle}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {boards.map((board) => (
                    <SelectItem key={board.id} value={board.id} className="text-xs">
                      <div className="flex items-center gap-1">
                        <span>{board.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            </div>
          </CardDescription>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadCard;