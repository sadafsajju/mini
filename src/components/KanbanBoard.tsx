import React, { useState, useEffect } from 'react';
import SkeletonLoader from './SkeletonLoader';
import { KanbanColumn as KanbanColumnType, Lead } from '@/types/leads';
import KanbanColumn from './KanbanColumn';
import KanbanCarousel from './KanbanCarousel';
import KanbanBoardManager from './KanbanBoardManager';
import DeleteZone from './DeleteZone';
import LeadDeleteAlert from './LeadDeleteAlert';
import { updateLead, deleteLead } from '@/lib/api/leads';
import { createCardMovementHistory } from '@/lib/api/kanbanCardHistory';
import KanbanCardMoveDialog from './KanbanCardMoveDialog';
import { useKanbanBoards } from '@/hooks/useKanbanBoards';
import { LeadFilterType } from '@/app/leads/page';

// Priority weight for sorting
const priorityWeight: Record<string, number> = {
  'high': 3,
  'medium': 2,
  'low': 1,
  'undefined': 0
};

interface KanbanBoardProps {
  leads: Lead[];
  onLeadUpdate?: (updatedLead: Lead) => void;
  onEditLead?: (id: number) => void;
  onContactLead?: (id: number) => void;
  filterType?: LeadFilterType;
  className?: string;
  showBoardManager?: boolean;
}

export default function KanbanBoard({ 
  leads, 
  onLeadUpdate,
  onEditLead,
  onContactLead,
  filterType = 'none',
  className = '',
  showBoardManager = false
}: KanbanBoardProps) {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [sourceColumn, setSourceColumn] = useState<KanbanColumnType | null>(null);
  const [localLeads, setLocalLeads] = useState<Lead[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pendingMove, setPendingMove] = useState<{
    lead: Lead | null,
    sourceColumn: KanbanColumnType | null,
    targetColumn: KanbanColumnType | null
  }>({ lead: null, sourceColumn: null, targetColumn: null });
  const [isOverDeleteZone, setIsOverDeleteZone] = useState(false);
  // Track if we've had a successful load to prevent showing loading spinners
  const hasLoadedBefore = React.useRef(false);
  
  // Use the custom hook to manage kanban boards
  const { 
    boards: originalColumns, 
    loading: boardsLoading,
    error: boardsError,
    addBoard,
    updateBoard,
    removeBoard,
    reorderBoards,
    fetchBoards
  } = useKanbanBoards(localLeads);

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

  // Create wrapper functions with the correct return types
  const handleAddBoard = async (board: Omit<KanbanColumnType, 'leads' | 'id'>) => {
    const result = await addBoard(board);
    // Add empty leads array to match the expected return type
    return { ...result, leads: [] } as KanbanColumnType;
  };

  const handleUpdateBoard = async (id: string, board: Partial<Omit<KanbanColumnType, 'leads' | 'id'>>) => {
    const result = await updateBoard(id, board);
    // Add empty leads array to match the expected return type
    return { ...result, leads: [] } as KanbanColumnType;
  };

  // Apply filters to leads in each column
  const columns = React.useMemo(() => {
    // If boards have loaded successfully, mark our ref
    if (originalColumns.length > 0) {
      hasLoadedBefore.current = true;
    }

    return originalColumns.map(column => {
      const filteredLeads = [...column.leads];
      
      // Apply filters based on filterType
      switch (filterType) {
        case 'priority-high-first':
          filteredLeads.sort((a, b) => {
            // Handle undefined priorities by using the string 'undefined'
            const priorityA = a.priority || 'undefined';
            const priorityB = b.priority || 'undefined';
            return priorityWeight[priorityB] - priorityWeight[priorityA];
          });
          break;
        case 'priority-low-first':
          filteredLeads.sort((a, b) => {
            // Handle undefined priorities by using the string 'undefined'
            const priorityA = a.priority || 'undefined';
            const priorityB = b.priority || 'undefined';
            return priorityWeight[priorityA] - priorityWeight[priorityB];
          });
          break;
        case 'date-newest':
          filteredLeads.sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
          });
          break;
        case 'date-oldest':
          filteredLeads.sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateA - dateB;
          });
          break;
        default:
          // No filtering
          break;
      }
      
      return {
        ...column,
        leads: filteredLeads
      };
    });
  }, [originalColumns, filterType]);

  // Only show loading spinner on very first load when no data exists yet
  // Never show loading indicator if we've successfully loaded data before
  const shouldShowLoading = !hasLoadedBefore.current && boardsLoading && columns.length === 0;

  // Keep local state of leads for smooth drag-and-drop even when API updates fail
  // We use a ref to track if this is the initial load to avoid unnecessary refreshes
  const isInitialLoad = React.useRef(true);
  
  useEffect(() => {
    // Only update localLeads when the leads prop changes
    setLocalLeads(leads);
    
    // Skip the first render to avoid double loading
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
  }, [leads]);

  const handleDragStart = (e: React.DragEvent, lead: Lead, column: KanbanColumnType) => {
    setDraggedLead(lead);
    setSourceColumn(column);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsOverDeleteZone(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDeleteZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsOverDeleteZone(true);
  };

  const handleDeleteZoneDragLeave = () => {
    setIsOverDeleteZone(false);
  };

  const handleDeleteZoneDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverDeleteZone(false);
    setIsDragging(false);
    
    if (draggedLead && sourceColumn) {
      // Open delete confirmation dialog instead of deleting immediately
      setDeleteAlertOpen(true);
    } else {
      // Reset state if no lead is being dragged
      setDraggedLead(null);
      setSourceColumn(null);
    }
  };
  
  // Handle actual deletion after confirmation
  const handleConfirmDelete = async () => {
    if (!draggedLead) return;
    
    try {
      setIsDeleting(true);
      
      // Update local state immediately for better UX
      setLocalLeads(prev => prev.filter(lead => lead.id !== draggedLead.id));
      
      // Delete the lead from the database
      await deleteLead(draggedLead.id);
      
      // Call the callback to inform parent components about deletion
      if (onLeadUpdate) {
        // We're passing a special flag to indicate deletion
        onLeadUpdate({
          ...draggedLead,
          __deleted: true
        } as Lead & { __deleted: boolean });
      }
      
      // Close the alert dialog
      setDeleteAlertOpen(false);
    } catch (error) {
      console.error('Error deleting lead:', error);
      
      // Revert the local change if the API delete fails
      // The original leads array from props will have the lead we tried to delete
      setLocalLeads(leads);
      fetchBoards({ silent: true });
    } finally {
      setIsDeleting(false);
      setDraggedLead(null);
      setSourceColumn(null);
    }
  };

  // Local function to update columns with a lead moved to a new column
  const updateColumnsLocally = (leadId: number, sourceColumnId: string, targetColumnId: string) => {
    // Find the lead in the source column
    const sourceColumnIndex = originalColumns.findIndex(col => col.id === sourceColumnId);
    if (sourceColumnIndex === -1) return;
    
    const leadIndex = originalColumns[sourceColumnIndex].leads.findIndex(lead => lead.id === leadId);
    if (leadIndex === -1) return;
    
    // Get the lead and update its status
    const lead = { ...originalColumns[sourceColumnIndex].leads[leadIndex], status: targetColumnId };
    
    return { updatedLead: lead };
  };

  const handleDrop = async (e: React.DragEvent, targetColumn: KanbanColumnType) => {
    e.preventDefault();
    
    if (draggedLead && sourceColumn && targetColumn.id !== sourceColumn.id) {
      // Instead of immediately updating, store the pending move and show dialog
      setPendingMove({
        lead: draggedLead,
        sourceColumn: sourceColumn,
        targetColumn: targetColumn
      });
      setMoveDialogOpen(true);
      
      // Keep the dragging state active until dialog is closed
      return;
    }
    
    setDraggedLead(null);
    setSourceColumn(null);
    setIsDragging(false);
  };
  
  // Handle the actual move after notes are entered
  const handleMoveWithNotes = async (notes: string) => {
    const { lead, sourceColumn, targetColumn } = pendingMove;
    
    if (!lead || !sourceColumn || !targetColumn) return;
    
    // Update locally first for smooth UI without triggering loading state
    const result = updateColumnsLocally(lead.id, sourceColumn.id, targetColumn.id);
    if (!result) {
      setDraggedLead(null);
      setSourceColumn(null);
      setIsDragging(false);
      setPendingMove({ lead: null, sourceColumn: null, targetColumn: null });
      return;
    }
    
    const { updatedLead } = result;
    
    // Update the local leads state
    setLocalLeads(prev => {
      return prev.map(l => 
        l.id === lead.id ? updatedLead : l
      );
    });
    
    try {
      // Update lead status in the database
      const apiUpdatedLead = await updateLead(lead.id, { 
        status: targetColumn.id
      });
      
      // Create history entry for the movement with notes
      await createCardMovementHistory(
        lead.id,
        sourceColumn.id,
        targetColumn.id,
        notes,
        getColumnTitleById(sourceColumn.id),
        getColumnTitleById(targetColumn.id)
      );
      
      // Call the callback to refresh the leads
      if (onLeadUpdate) {
        onLeadUpdate(apiUpdatedLead);
      }
    } catch (error) {
      console.error('Error updating lead status or creating history:', error);
      
      // Revert the local change if the API update fails
      setLocalLeads(prev => {
        return prev.map(l => 
          l.id === lead.id ? { ...l, status: sourceColumn.id } : l
        );
      });
    }
    
    // Reset state
    setDraggedLead(null);
    setSourceColumn(null);
    setIsDragging(false);
    setPendingMove({ lead: null, sourceColumn: null, targetColumn: null });
  };
  
  // Handle dialog close without saving
  const handleCancelMove = () => {
    setMoveDialogOpen(false);
    setDraggedLead(null);
    setSourceColumn(null);
    setIsDragging(false);
    setPendingMove({ lead: null, sourceColumn: null, targetColumn: null });
  };
  
  // Get column title by id (helper function for history)
  const getColumnTitleById = (columnId: string): string => {
    const column = columns.find(col => col.id === columnId);
    return column?.title || columnId;
  };

  // Handle priority or other lead property updates
  const handleLeadPropertyUpdate = async (updatedLead: Lead) => {
    try {
      // Update local state immediately
      setLocalLeads(prev => 
        prev.map(lead => lead.id === updatedLead.id ? updatedLead : lead)
      );
      
      // Call the parent's onLeadUpdate callback if provided
      if (onLeadUpdate) {
        onLeadUpdate(updatedLead);
      }
    } catch (error) {
      console.error('Error updating lead property:', error);
      
      // Revert local changes if needed
      setLocalLeads(leads);
      fetchBoards({ silent: true });
    }
  };

  // Re-fetch boards when leads change
  useEffect(() => {
    // This will refresh the boards when the component receives new leads
    if (!isInitialLoad.current) {
      fetchBoards({ silent: true });
    }
  }, [fetchBoards, localLeads]);

  // Display empty columns instead of loading spinner if we're loading but have seen data before
  if (!shouldShowLoading && boardsLoading && columns.length === 0 && hasLoadedBefore.current) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex gap-4 pb-6 pt-2 px-2 w-fit overflow-x-auto overflow-y-hidden h-full">
          <div className="bg-muted/60 dark:bg-muted/20 rounded-2xl min-w-64 w-72 flex-shrink-0 h-[calc(100vh-11rem)] flex flex-col">
            <div className="flex items-center justify-between mb-3 px-4 pt-3">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2 bg-blue-500"></div>
                <span>New</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`w-full ${className}`}
      onDragEnd={handleDragEnd}
    >
      {showBoardManager && (
        <KanbanBoardManager 
          boards={originalColumns}
          onAddBoard={handleAddBoard}
          onUpdateBoard={handleUpdateBoard}
          onRemoveBoard={removeBoard}
          onReorderBoards={reorderBoards}
        />
      )}

      {shouldShowLoading ? (
        <SkeletonLoader variant="kanban" />
      ) : boardsError ? (
        <div className="bg-destructive/10 border border-destructive/30 rounded-md p-4 mb-6">
          <p className="text-destructive font-medium">{boardsError}</p>
        </div>
      ) : (
        <>
          {/* Conditionally render KanbanCarousel for mobile or regular columns for desktop */}
          {isMobile ? (
            <KanbanCarousel
              columns={columns}
              onEditLead={onEditLead}
              onContactLead={onContactLead}
              onLeadUpdate={handleLeadPropertyUpdate}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onMobileMoveCard={(lead, sourceColumn, targetColumn) => {
                // We're intentionally separating the drag-and-drop flow from the direct
                // mobile card movement flow to avoid simulation issues
                setPendingMove({
                  lead,
                  sourceColumn,
                  targetColumn
                });
                setMoveDialogOpen(true);
              }}
            />
          ) : (
            <div className="flex gap-4 pb-6 pt-2 px-2 w-fit overflow-x-auto overflow-y-hidden h-full">
              {columns.map(column => (
                <KanbanColumn
                  key={`${column.id}-${column.leads.length}-${filterType}`} // Include filterType in key to force re-render
                  column={column}
                  onEditLead={onEditLead}
                  onContactLead={onContactLead}
                  onLeadUpdate={handleLeadPropertyUpdate}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  allColumns={columns}
                  onMoveCard={(lead, sourceColumn, targetColumn) => {
                    // Create a pending move and show dialog just like in the mobile flow
                    setPendingMove({
                      lead,
                      sourceColumn,
                      targetColumn
                    });
                    setMoveDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Use our DeleteZone component */}
      <DeleteZone
        visible={isDragging}
        isOver={isOverDeleteZone}
        onDragOver={handleDeleteZoneDragOver}
        onDragLeave={handleDeleteZoneDragLeave}
        onDrop={handleDeleteZoneDrop}
      />
      
      {/* Movement Notes Dialog */}
      <KanbanCardMoveDialog
        isOpen={moveDialogOpen}
        onClose={handleCancelMove}
        lead={pendingMove.lead}
        fromColumn={pendingMove.sourceColumn?.title || ''}
        toColumn={pendingMove.targetColumn?.title || ''}
        onSave={handleMoveWithNotes}
      />
      
      {/* Delete Confirmation Alert Dialog */}
      <LeadDeleteAlert
        isOpen={deleteAlertOpen}
        onOpenChange={setDeleteAlertOpen}
        lead={draggedLead}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}