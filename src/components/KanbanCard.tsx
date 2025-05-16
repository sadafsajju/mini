import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Lead } from '@/types/leads';
import { Pencil, Phone } from 'lucide-react';

interface KanbanCardProps {
  lead: Lead;
  onEditLead?: (id: number) => void;
  onContactLead?: (id: number) => void;
}

export default function KanbanCard({ lead, onEditLead, onContactLead }: KanbanCardProps) {
  const initials = lead.name
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
    
  const formattedDate = lead.created_at 
    ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })
    : '';

  return (
    <Card className="mb-3 shadow-none border-none rounded-xl hover:shadow-md transition-shadow group relative">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEditLead && onEditLead(lead.id)}
              className="absolute right-2 top-2 h-7 w-7 p-0 opacity-0 bg-white/10 hover:bg-blue-600/10 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
              <Pencil className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Edit</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <CardHeader className="p-3 pb-0">
        <div className="flex justify-between items-start mb-2">
          {/* Status is shown by the column itself, no need for a badge */}
        </div>
        <CardTitle className="text-base font-normal capitalize">{lead.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-2 pb-2">
        <div className="flex items-center text-sm text-muted-foreground mb-1">
            {lead.email}
        </div>
        {lead.phone_number && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Phone className="h-3 w-3 mr-2" />
            <span>{lead.phone_number}</span>
          </div>
        )}

          <div className="mt-2 text-sm border-t pt-2 text-muted-foreground line-clamp-2">
            {lead.created_at && (
              <CardDescription className="flex items-center text-xs">
                {formattedDate}
              </CardDescription>
            )}
          </div>

      </CardContent>

    </Card>
  );
}