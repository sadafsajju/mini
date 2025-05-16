import React, { useState } from 'react';
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

// Map for border colors
const borderColorMap: Record<string, string> = {
  blue: 'border-blue-500',
  yellow: 'border-yellow-500',
  green: 'border-green-500',
  purple: 'border-purple-500',
  gray: 'border-gray-500',
  red: 'border-red-500',
};

export default function KanbanColumn({ 
  column,
  onEditLead,
  onContactLead,
  onDragStart,
  onDragOver,
  onDrop
}: KanbanColumnProps) {
  // Get the background and border color classes or use defaults
  const colorClass = colorMap[column.color] || 'bg-blue-500';
  const borderColorClass = borderColorMap[column.color] || 'border-blue-500';
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div 
      className={`bg-muted/60 rounded-2xl min-w-64 w-72 flex-shrink-0 h-[calc(100vh-11rem)] flex flex-col transition-all ${isDragOver ? `border-2 ${borderColorClass}` : 'border-2 border-transparent'}`}
      onDragOver={e => {
        e.preventDefault();
        setIsDragOver(true);
        onDragOver && onDragOver(e);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={e => {
        setIsDragOver(false);
        onDrop && onDrop(e, column);
      }}
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
      
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-3 mt-3">
          {column.leads.map(lead => (
            <div 
              key={lead.id} 
              draggable
              onDragStart={e => onDragStart && onDragStart(e, lead, column)}
              className="cursor-default active:cursor-grabbing"
            >
              <KanbanCard 
                lead={lead} 
                onEditLead={onEditLead}
                onContactLead={onContactLead}
              />
            </div>
          ))}

        </div>
      </ScrollArea>
    </div>
  );
}