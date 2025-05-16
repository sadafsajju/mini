import React from 'react';
import { Badge } from '@/components/ui/badge';
import KanbanCard from './KanbanCard';
import { KanbanColumn as KanbanColumnType, Lead } from '@/types/leads';
import { Separator } from './ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface KanbanColumnProps {
  column: KanbanColumnType;
  onEditLead?: (id: number) => void;
  onContactLead?: (id: number) => void;
  onDragStart?: (e: React.DragEvent, lead: Lead, sourceColumn: KanbanColumnType) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetColumn: KanbanColumnType) => void;
}

// Map to convert column colors to Tailwind classes
const colorMap: Record<string, string> = {
  blue: 'bg-blue-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  gray: 'bg-gray-500',
  red: 'bg-red-500',
};

export default function KanbanColumn({ 
  column,
  onEditLead,
  onContactLead,
  onDragStart,
  onDragOver,
  onDrop
}: KanbanColumnProps) {
  // Get the background color class or use a default
  const colorClass = colorMap[column.color] || 'bg-blue-500';

  return (
    <div 
      className="bg-muted/60 rounded-2xl min-w-64 w-72 flex-shrink-0 h-[calc(100vh-11rem)]  flex flex-col"
      onDragOver={e => onDragOver && onDragOver(e)}
      onDrop={e => onDrop && onDrop(e, column)}
    >
      <div className="flex items-center justify-between mb-3 px-4 pt-3">
        <h3 className="font-medium flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${colorClass}`}>
          </div>
          {column.title}
        </h3>
        <Badge variant="outline">{column.leads.length}</Badge>
      </div>
      <Separator></Separator>
      
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {column.leads.map(lead => (
            <div 
              key={lead.id} 
              draggable
              onDragStart={e => onDragStart && onDragStart(e, lead, column)}
              className="cursor-grab active:cursor-grabbing"
            >
              <KanbanCard 
                lead={lead} 
                onEditLead={onEditLead}
                onContactLead={onContactLead}
              />
            </div>
          ))}
          
          {column.leads.length === 0 && (
            <div className="text-center py-10 px-3 border border-dashed rounded-md text-muted-foreground text-sm">
              Drop leads here
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}