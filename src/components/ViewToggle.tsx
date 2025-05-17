import React from 'react';
import { Kanban, Grid3X3, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewType = 'kanban' | 'card' | 'list';

interface ViewToggleProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export default function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="inline-flex items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
      <ViewToggleButton 
        active={currentView === 'kanban'} 
        icon={<Kanban className="h-4 w-4" />}
        onClick={() => onViewChange('kanban')}
      />
      <ViewToggleButton 
        active={currentView === 'card'} 
        icon={<Grid3X3 className="h-4 w-4" />}
        onClick={() => onViewChange('card')}
      />
      <ViewToggleButton 
        active={currentView === 'list'} 
        icon={<List className="h-4 w-4" />}
        onClick={() => onViewChange('list')}
      />
    </div>
  );
}

interface ViewToggleButtonProps {
  active: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}

function ViewToggleButton({ active, icon, onClick }: ViewToggleButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        active 
          ? "bg-background text-foreground shadow-sm" 
          : "hover:bg-muted/80 hover:text-foreground"
      )}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}
