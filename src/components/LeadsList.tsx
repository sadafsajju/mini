import React, { useState } from 'react';
import { Lead, KanbanColumn } from '@/types/leads';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Phone, Mail, Flag, ArrowUp, ArrowDown, History, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useLeadDelete } from './LeadDeleteProvider';
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
import KanbanCardHistory from './KanbanCardHistory';

interface LeadsListProps {
  leads: Lead[];
  boards?: KanbanColumn[]; // Add boards prop
  onEditLead?: (id: number) => void;
  onSort?: (column: string) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onContactLead?: (id: number) => void;
}

export default function LeadsList({
  leads,
  boards = [],
  onEditLead,
  onSort,
  sortColumn,
  sortDirection,
  onContactLead
}: LeadsListProps) {
  const { openDeleteDialog } = useLeadDelete();
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [selectedLeadName, setSelectedLeadName] = useState<string>("");
  
  const handleViewHistory = (leadId: number, leadName: string) => {
    setSelectedLeadId(leadId);
    setSelectedLeadName(leadName);
    setHistoryDialogOpen(true);
  };

  if (leads.length === 0) {
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

  // Status badge configuration for each column color
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  // Sort indicator component
  const SortIndicator = ({ column }: { column: string }) => {
    if (sortColumn !== column) return null;
    
    return sortDirection === 'asc' ? 
      <ArrowUp className="ml-1 h-4 w-4" /> : 
      <ArrowDown className="ml-1 h-4 w-4" />;
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
          {leads.map(lead => {
            const timeAgo = lead.created_at 
              ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })
              : 'N/A';
              
            // Get status color for badge
            const statusColor = getBoardColor(lead.status);
            const statusColorClass = statusColor ? colorMap[statusColor] || '' : '';
              
            return (
              <TableRow key={lead.id}>
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
                    <Badge variant="outline" className={`${statusColorClass}`}>
                      {getBoardTitle(lead.status)}
                    </Badge>
                  ) : 'N/A'}
                </TableCell>
                <TableCell>
                  {lead.priority ? (
                    <Badge variant="outline" className={`flex items-center w-fit ${priorityConfig[lead.priority as keyof typeof priorityConfig].class}`}>
                      {priorityConfig[lead.priority as keyof typeof priorityConfig].icon}
                      <span className="capitalize">{lead.priority}</span>
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
              Complete history for "{selectedLeadName}"
            </SheetDescription>
          </SheetHeader>
          {selectedLeadId && <KanbanCardHistory leadId={selectedLeadId} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}