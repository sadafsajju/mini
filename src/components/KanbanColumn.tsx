import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import KanbanCard from './KanbanCard';
import { KanbanColumn as KanbanColumnType, Lead } from '@/types/leads';
import { Separator } from './ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface KanbanColumnProps {
  column: KanbanColumnType;
  allColumns?: KanbanColumnType[];
  onEditLead?: (id: number) => void;
  onContactLead?: (id: number) => void;
  onLeadUpdate?: (updatedLead: Lead) => void;
  onDragStart?: (e: React.DragEvent, lead: Lead, sourceColumn: KanbanColumnType) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetColumn: KanbanColumnType) => void;
  onMoveCard?: (lead: Lead, sourceColumn: KanbanColumnType, targetColumn: KanbanColumnType) => void;
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
  allColumns,
  onEditLead,
  onContactLead,
  onLeadUpdate,
  onDragStart,
  onDragOver,
  onDrop,
  onMoveCard
}: KanbanColumnProps) {
  // Get the background and border color classes or use defaults
  const colorClass = `${colorMap[column.color]?.light || 'bg-blue-500'} dark:${colorMap[column.color]?.dark || 'bg-blue-600'}`;
  const borderColorClass = `${borderColorMap[column.color]?.light || 'border-blue-500'} dark:${borderColorMap[column.color]?.dark || 'border-blue-600'}`;
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if this is a mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return (
    <div 
      className={`bg-muted/60 dark:bg-muted/20 rounded-2xl ${
        isMobile 
          ? 'w-full max-w-screen-sm mx-auto' 
          : 'min-w-64 w-72 flex-shrink-0'
      } h-[calc(100vh-15rem)] flex flex-col transition-all ${
        isDragOver ? `border-2 ${borderColorClass}` : 'border-2 border-transparent'
      }`}
      onDragOver={e => {
        e.preventDefault();
        setIsDragOver(true);
        if (onDragOver) onDragOver(e);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={e => {
        setIsDragOver(false);
        if (onDrop) onDrop(e, column);
      }}
    >
      {/* We hide the column title when in mobile carousel mode since it's shown above */}
      {!isMobile && (
        <div className="flex items-center justify-between mb-3 px-4 pt-3">
          <h3 className="font-medium flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${colorClass}`}>
            </div>
            {column.title}
          </h3>
          <Badge variant="outline" className="dark:bg-background/40">{column.leads.length}</Badge>
        </div>
      )}
      
      {!isMobile && <Separator className="dark:bg-muted/30" />}
      
      <ScrollArea className="flex-1 px-3">
        <div className={`space-y-3 ${isMobile ? 'pt-2' : 'mt-3'}`}>
          {column.leads.map(lead => (
            <div 
              key={lead.id} 
              draggable
              onDragStart={e => onDragStart && onDragStart(e, lead, column)}
              className="cursor-default active:cursor-grabbing"
            >
              <KanbanCard 
                lead={lead} 
                column={column}
                allColumns={allColumns}
                onEditLead={onEditLead}
                onContactLead={onContactLead}
                onLeadUpdate={onLeadUpdate}
                onMoveCard={onMoveCard}
              />
            </div>
          ))}
          
          {/* Show empty state if no leads in the column */}
          {column.leads.length === 0 && (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              No leads in this column
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}