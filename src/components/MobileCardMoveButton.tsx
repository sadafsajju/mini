import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MoveHorizontal } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { KanbanColumn as KanbanColumnType, Lead } from '@/types/leads';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';

interface MobileCardMoveButtonProps {
  lead: Lead;
  currentColumn: KanbanColumnType;
  allColumns: KanbanColumnType[];
  onMoveCard: (lead: Lead, sourceColumn: KanbanColumnType, targetColumn: KanbanColumnType) => void;
}

export default function MobileCardMoveButton({
  lead,
  currentColumn,
  allColumns,
  onMoveCard
}: MobileCardMoveButtonProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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

  // Filter out the current column
  const otherColumns = allColumns.filter(column => column.id !== currentColumn.id);

  // Only show button on mobile devices
  if (!isMobile) return null;

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsSheetOpen(true)}
              className="absolute right-[72px] top-2 h-7 w-7 p-0 opacity-0 bg-blue-800/10 hover:bg-blue-800/30 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
            >
              <MoveHorizontal className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Move Card</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Move Card</SheetTitle>
            <SheetDescription>
              Move &quot;{lead.name}&quot; to another column
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-4 grid gap-2">
            {otherColumns.map(column => (
              <Button
                key={column.id}
                variant="outline"
                className="w-full justify-start text-left h-16 relative overflow-hidden"
                onClick={() => {
                  onMoveCard(lead, currentColumn, column);
                  setIsSheetOpen(false);
                }}
              >
                <div 
                  className={`absolute left-0 top-0 bottom-0 w-1.5 bg-${column.color}-500`}
                  style={{ backgroundColor: getColumnColor(column.color) }}
                ></div>
                <div className="ml-3">
                  <div className="font-medium">{column.title}</div>
                  <div className="text-xs text-muted-foreground">{column.leads.length} items</div>
                </div>
              </Button>
            ))}
          </div>
          
          <SheetClose asChild>
            <Button variant="outline" className="w-full mt-4">
              Cancel
            </Button>
          </SheetClose>
        </SheetContent>
      </Sheet>
    </>
  );
}

// Helper function to get column color
function getColumnColor(color: string): string {
  const colorMap: Record<string, string> = {
    blue: '#3b82f6',
    yellow: '#eab308',
    green: '#22c55e',
    purple: '#a855f7',
    gray: '#6b7280',
    red: '#ef4444'
  };
  
  return colorMap[color] || '#3b82f6';
}