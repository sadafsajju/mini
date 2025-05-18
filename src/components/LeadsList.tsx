import React, { useState, useEffect } from 'react';
import { Lead, KanbanColumn } from '@/types/leads';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Mail, Flag, ArrowUp, ArrowDown, History, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useLeadDelete } from './LeadDeleteProvider';
import { updateLead } from '@/lib/api/leads';
import { createCardMovementHistory } from '@/lib/api/kanbanCardHistory';
import KanbanCardMoveDialog from './KanbanCardMoveDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import KanbanCardHistory from './KanbanCardHistory';

interface LeadsListProps {
  leads: Lead[];
  boards?: KanbanColumn[]; // Add boards prop
  onEditLead?: (id: number) => void;
  onSort?: (column: string) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onContactLead?: (id: number) => void;
  onLeadUpdate?: (updatedLead: Lead) => void;
}

export default function LeadsList({
  leads: propLeads,
  boards = [],
  onEditLead,
  onSort,
  sortColumn,
  sortDirection,
  onLeadUpdate
}: LeadsListProps) {
  const { openDeleteDialog } = useLeadDelete();
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [selectedLeadName, setSelectedLeadName] = useState<string>("");
  
  // Local copy of leads that we can modify directly
  const [localLeads, setLocalLeads] = useState<Lead[]>([]);
  
  // Update local leads when props change
  useEffect(() => {
    setLocalLeads(propLeads);
  }, [propLeads]);
  
  // State for status change dialog
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    lead: Lead;
    newStatus: string;
    oldStatus: string | undefined;
    fromTitle: string | undefined;
    toTitle: string | undefined;
  } | null>(null);
  
  // Priority badge configuration
  const priorityConfig = {
    high: { 
      class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      icon: <Flag className="h-3 w-3 mr-1" /> 
    },
    medium: { 
      class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      icon: <Flag className="h-3 w-3 mr-1" /> 
    },
    low: { 
      class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      icon: <Flag className="h-3 w-3 mr-1" /> 
    }
  };
  
  // Function to render the priority value with proper icon
  const renderPriorityValue = (priority: string | undefined) => {
    if (!priority) return <span>Set priority</span>;
    return (
      <div className="flex items-center gap-1 text-xs">
        {priorityConfig[priority as keyof typeof priorityConfig]?.icon || <Flag className="h-3 w-3 mr-1" />}
        <span className="capitalize">{priority}</span>
      </div>
    );
  };
  
  const handleViewHistory = (leadId: number, leadName: string) => {
    setSelectedLeadId(leadId);
    setSelectedLeadName(leadName);
    setHistoryDialogOpen(true);
  };

  if (localLeads.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No leads found. Try adjusting your search or add new leads.</p>
      </div>
    );
  }

  // Create a map of board IDs to titles for quick lookup
  const boardMap = new Map(boards.map(board => [board.id, board]));

  // Function to get a board's title by its ID
  const getBoardTitle = (boardId: string | undefined) => {
    if (!boardId) return 'N/A';
    const board = boardMap.get(boardId);
    return board ? board.title : boardId;
  };

  // Function to get a board's color by its ID
  const getBoardColor = (boardId: string | undefined) => {
    if (!boardId) return '';
    const board = boardMap.get(boardId);
    return board ? board.color : '';
  };
  
  // Handle status change
  const handleStatusChange = (leadId: number, newStatus: string) => {
    const leadIndex = localLeads.findIndex(l => l.id === leadId);
    if (leadIndex === -1 || localLeads[leadIndex].status === newStatus) return;
    
    const lead = localLeads[leadIndex];
    
    // Find the new board to get its title
    const newBoard = boardMap.get(newStatus);
    // Find the current board
    const currentBoard = boardMap.get(lead.status || '');
    
    // Set the pending status change
    setPendingStatusChange({
      lead,
      newStatus,
      oldStatus: lead.status,
      fromTitle: currentBoard?.title,
      toTitle: newBoard?.title
    });
    
    // Open the move dialog
    setMoveDialogOpen(true);
  };
  
  // Handle actual status change after notes are entered
  const handleMoveWithNotes = async (notes: string) => {
    if (!pendingStatusChange) return;
    
    const { lead, newStatus, oldStatus } = pendingStatusChange;
    
    try {
      // Update our local state immediately
      const leadIndex = localLeads.findIndex(l => l.id === lead.id);
      if (leadIndex !== -1) {
        const updatedLeads = [...localLeads];
        updatedLeads[leadIndex] = {
          ...updatedLeads[leadIndex],
          status: newStatus
        };
        setLocalLeads(updatedLeads);
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
      
      // Revert local state if there was an error
      const leadIndex = localLeads.findIndex(l => l.id === lead.id);
      if (leadIndex !== -1) {
        const revertedLeads = [...localLeads];
        revertedLeads[leadIndex].status = oldStatus;
        setLocalLeads(revertedLeads);
      }
    } finally {
      setPendingStatusChange(null);
      setMoveDialogOpen(false);
    }
  };
  
  // Handle dialog close without saving
  const handleCancelMove = () => {
    setMoveDialogOpen(false);
    setPendingStatusChange(null);
  };

  // Priority change functionality removed - now display only

  // Status badge configuration for each column color
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  // Column header with sort capability
  const SortableHeader = ({ column, label }: { column: string, label: string }) => {
    return (
      <div 
        className="flex items-center cursor-pointer"
        onClick={() => onSort && onSort(column)}
      >
        {label} 
        {sortColumn === column && 
          (sortDirection === 'asc' ? 
            <ArrowUp className="ml-1 h-4 w-4" /> : 
            <ArrowDown className="ml-1 h-4 w-4" />
          )
        }
      </div>
    );
  };

  return (
    <div className="w-full overflow-auto">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">
              {onSort ? 
                <SortableHeader column="name" label="Name" /> : 
                "Name"
              }
            </TableHead>
            <TableHead>
              {onSort ? 
                <SortableHeader column="email" label="Email" /> : 
                "Email"
              }
            </TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>
              {onSort ? 
                <SortableHeader column="status" label="Status" /> : 
                "Status"
              }
            </TableHead>
            <TableHead>
              {onSort ? 
                <SortableHeader column="priority" label="Priority" /> : 
                "Priority"
              }
            </TableHead>
            <TableHead>
              {onSort ? 
                <SortableHeader column="created_at" label="Created" /> : 
                "Created"
              }
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {localLeads.map(lead => {
            // Force a re-render of the row when priority changes
            const rowKey = `lead-${lead.id}-${lead.priority}-${lead.status}`;
            
            const timeAgo = lead.created_at 
              ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })
              : 'N/A';
              
            // Get status color for badge
            const statusColor = getBoardColor(lead.status);
            const statusColorClass = statusColor ? colorMap[statusColor] || '' : '';
              
            return (
              <TableRow key={rowKey}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>
                  <a href={`mailto:${lead.email}`} className="text-primary hover:underline flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    {lead.email}
                  </a>
                </TableCell>
                <TableCell>{lead.phone_number || 'N/A'}</TableCell>
                <TableCell>
                  {lead.status ? (
                    <Select
                      value={lead.status}
                      onValueChange={(newStatus) => handleStatusChange(lead.id, newStatus)}
                    >
                      <SelectTrigger className={`h-8 w-40 px-2 ${statusColorClass}`}>
                        <SelectValue>
                          <div className="flex items-center gap-1 text-xs">
                            {getBoardTitle(lead.status)}
                          </div>
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
                  ) : 'N/A'}
                </TableCell>
                <TableCell>
                  {lead.priority ? (
                    <Badge className={`${lead.priority ? priorityConfig[lead.priority as keyof typeof priorityConfig].class : ''}`}>
                      <div className="flex items-center gap-1">
                        {priorityConfig[lead.priority as keyof typeof priorityConfig]?.icon || <Flag className="h-3 w-3 mr-1" />}
                        <span className="capitalize">{lead.priority}</span>
                      </div>
                    </Badge>
                  ) : 'N/A'}
                </TableCell>
                <TableCell className="text-muted-foreground">{timeAgo}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => openDeleteDialog(lead)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Delete Lead"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleViewHistory(lead.id, lead.name)}
                      className="text-muted-foreground hover:text-foreground"
                      title="View History"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onEditLead && onEditLead(lead.id)}
                      className="text-muted-foreground hover:text-foreground"
                      title="Edit Lead"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* History Sheet */}
      <Sheet open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <SheetContent side="right" className="overflow-y-auto w-full sm:max-w-md">
          <SheetHeader className="mb-4">
            <SheetTitle>Card Movement Timeline</SheetTitle>
            <SheetDescription>
              Complete history for &quot;{selectedLeadName}&quot;
            </SheetDescription>
          </SheetHeader>
          {selectedLeadId && <KanbanCardHistory leadId={selectedLeadId} />}
        </SheetContent>
      </Sheet>
      
      {/* Movement Notes Dialog */}
      <KanbanCardMoveDialog
        isOpen={moveDialogOpen}
        onClose={handleCancelMove}
        lead={pendingStatusChange?.lead || null}
        fromColumn={pendingStatusChange?.fromTitle || ''}
        toColumn={pendingStatusChange?.toTitle || ''}
        onSave={handleMoveWithNotes}
      />
    </div>
  );
}