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
  onLeadUpdate?: (updatedLead: Lead) => void;
  onDragStart?: (e: React.DragEvent, lead: Lead, sourceColumn: KanbanColumnType) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetColumn: KanbanColumnType) => void;
}

// Map to convert column colors to Tailwind classes for light and dark mode
const colorMap: Record<string, { light: string, dark: string }> = {
  blue: { 
    light: 'bg-blue-500', 
    dark: 'bg-blue-600'
  },
  yellow: { 
    light: 'bg-yellow-500', 
    dark: 'bg-yellow-600'
  },
  green: { 
    light: 'bg-green-500', 
    dark: 'bg-green-600'
  },
  purple: { 
    light: 'bg-purple-500', 
    dark: 'bg-purple-600'
  },
  gray: { 
    light: 'bg-gray-500', 
    dark: 'bg-gray-600'
  },
  red: { 
    light: 'bg-red-500', 
    dark: 'bg-red-600'
  },
};

// Map for border colors
const borderColorMap: Record<string, { light: string, dark: string }> = {
  blue: { 
    light: 'border-blue-500', 
    dark: 'border-blue-600'
  },
  yellow: { 
    light: 'border-yellow-500', 
    dark: 'border-yellow-600'
  },
  green: { 
    light: 'border-green-500', 
    dark: 'border-green-600'
  },
  purple: { 
    light: 'border-purple-500', 
    dark: 'border-purple-600'
  },
  gray: { 
    light: 'border-gray-500', 
    dark: 'border-gray-600'
  },
  red: { 
    light: 'border-red-500', 
    dark: 'border-red-600'
  },
};

export default function KanbanColumn({ 
  column,
  onEditLead,
  onContactLead,
  onLeadUpdate,
  onDragStart,
  onDragOver,
  onDrop
}: KanbanColumnProps) {
  // Get the background and border color classes or use defaults
  const colorClass = `${colorMap[column.color]?.light || 'bg-blue-500'} dark:${colorMap[column.color]?.dark || 'bg-blue-600'}`;
  const borderColorClass = `${borderColorMap[column.color]?.light || 'border-blue-500'} dark:${borderColorMap[column.color]?.dark || 'border-blue-600'}`;
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div 
      className={`bg-muted/60 dark:bg-muted/20 rounded-2xl min-w-64 w-72 flex-shrink-0 h-[calc(100vh-15rem)] flex flex-col transition-all ${isDragOver ? `border-2 ${borderColorClass}` : 'border-2 border-transparent'}`}
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
        <Badge variant="outline" className="dark:bg-background/40">{column.leads.length}</Badge>
      </div>
      <Separator className="dark:bg-muted/30" />
      
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
                onLeadUpdate={onLeadUpdate}
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}