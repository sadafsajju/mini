import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lead } from '@/types/leads';
import { Pencil, Flag, History } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateLead } from '@/lib/api/leads';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import KanbanCardHistory from './KanbanCardHistory';

interface KanbanCardProps {
  lead: Lead;
  onEditLead?: (id: number) => void;
  onContactLead?: (id: number) => void;
  onLeadUpdate?: (updatedLead: Lead) => void;
}

export default function KanbanCard({ lead, onEditLead, onLeadUpdate }: KanbanCardProps) {
  const [priority, setPriority] = useState<string | undefined>(lead.priority);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const formattedDate = lead.created_at 
    ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })
    : '';

  // Priority configuration
  const priorityColors = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };
  
  const priorityIcons = {
    low: <Flag className="h-3 w-3" />,
    medium: <Flag className="h-3 w-3" />,
    high: <Flag className="h-3 w-3" />,
  };

  // Handle priority change
  const handlePriorityChange = async (newPriority: string) => {
    if (newPriority === priority) return;
    
    try {
      setIsUpdating(true);
      
      // Update local state immediately for better UX
      setPriority(newPriority);
      
      // Update the lead in the database
      const updatedLead = await updateLead(lead.id, { 
        priority: newPriority as 'low' | 'medium' | 'high' 
      });
      
      // Notify parent component about the update
      if (onLeadUpdate) {
        onLeadUpdate(updatedLead);
      }
    } catch (error) {
      console.error('Error updating lead priority:', error);
      // Revert to original priority if update fails
      setPriority(lead.priority);
    } finally {
      setIsUpdating(false);
    }
  };

  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  
  return (
    <Card className="mb-3 shadow-none border bg-card dark:bg-card/80 dark:border-muted/20 rounded-xl hover:shadow-md transition-shadow group relative">
      <TooltipProvider>
        {/* Edit button tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEditLead && onEditLead(lead.id)}
              className="absolute right-2 top-2 h-7 w-7 p-0 opacity-0 bg-blue-800/10 hover:bg-blue-800/30 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
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
              className="absolute right-10 top-2 h-7 w-7 p-0 opacity-0 bg-blue-800/10 hover:bg-blue-800/30 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
              <History className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View History</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* History Sheet */}
      <Sheet open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
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
          <CardDescription className="flex items-center justify-between text-xs py-2">
            <span>{formattedDate}</span>
            
            {/* Priority Dropdown */}
            <Select
              value={priority}
              onValueChange={handlePriorityChange}
              disabled={isUpdating}
            >
              <SelectTrigger 
                className={`w-24 h-6 px-2 text-xs border-none ${priority ? priorityColors[priority as keyof typeof priorityColors] : ''}`}
              >
                <SelectValue placeholder="Set priority">
                  {priority && (
                    <div className="flex items-center gap-1">
                      {priorityIcons[priority as keyof typeof priorityIcons]}
                      <span>{priority}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low" className="text-xs">
                  <div className="flex items-center gap-1">
                    <Flag className="h-3 w-3 text-blue-600" />
                    <span>Low</span>
                  </div>
                </SelectItem>
                <SelectItem value="medium" className="text-xs">
                  <div className="flex items-center gap-1">
                    <Flag className="h-3 w-3 text-yellow-600" />
                    <span>Medium</span>
                  </div>
                </SelectItem>
                <SelectItem value="high" className="text-xs">
                  <div className="flex items-center gap-1">
                    <Flag className="h-3 w-3 text-red-600" />
                    <span>High</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </CardDescription>
        </div>
      </CardContent>
    </Card>
  );
}