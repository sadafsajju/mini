import React, { useState, useEffect } from 'react';
import { KanbanColumn as KanbanColumnType, Lead } from '@/types/leads';
import KanbanColumn from './KanbanColumn';
import KanbanBoardManager from './KanbanBoardManager';
import DeleteZone from './DeleteZone';
import { updateLead, deleteLead } from '@/lib/api/leads';
import { useKanbanBoards } from '@/hooks/useKanbanBoards';

interface KanbanBoardProps {
  leads: Lead[];
  onLeadUpdate?: (updatedLead: Lead) => void;
  onEditLead?: (id: number) => void;
  onContactLead?: (id: number) => void;
  className?: string;
  showBoardManager?: boolean;
}

export default function KanbanBoard({ 
  leads, 
  onLeadUpdate,
  onEditLead,
  onContactLead,
  className = '',
  showBoardManager = false
}: KanbanBoardProps) {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [sourceColumn, setSourceColumn] = useState<KanbanColumnType | null>(null);
  const [localLeads, setLocalLeads] = useState<Lead[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isOverDeleteZone, setIsOverDeleteZone] = useState(false);
  
  // Use the custom hook to manage kanban boards
  const { 
    boards: columns, 
    loading: boardsLoading,
    error: boardsError,
    addBoard,
    updateBoard,
    removeBoard,
    fetchBoards
  } = useKanbanBoards(localLeads);

  // Only show loading spinner on initial load when no columns are available
  const shouldShowLoading = boardsLoading && columns.length === 0;

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
      try {
        // Update local state immediately for better UX
        setLocalLeads(prev => prev.filter(lead => lead.id !== draggedLead.id));
        
        // Important: Also update the columns state directly for immediate UI update
        const updatedColumns = columns.map(column => ({
          ...column,
          leads: column.leads.filter(lead => lead.id !== draggedLead.id)
        }));
        
        // Delete the lead from the database
        await deleteLead(draggedLead.id);
        
        // Call the callback to inform parent components about deletion
        if (onLeadUpdate) {
          // We're passing a special flag to indicate deletion
          onLeadUpdate({
            ...draggedLead,
            __deleted: true
          } as any);
        }
      } catch (error) {
        console.error('Error deleting lead:', error);
        
        // Revert the local change if the API delete fails
        // The original leads array from props will have the lead we tried to delete
        setLocalLeads(leads);
        fetchBoards({ silent: true });
      }
    }
    
    setDraggedLead(null);
    setSourceColumn(null);
  };

  // Local function to update columns with a lead moved to a new column
  const updateColumnsLocally = (leadId: number, sourceColumnId: string, targetColumnId: string) => {
    // Create a deep copy of the current columns
    const updatedColumns = columns.map(column => ({
      ...column,
      leads: [...column.leads]
    }));
    
    // Find the lead in the source column
    const sourceColumnIndex = updatedColumns.findIndex(col => col.id === sourceColumnId);
    if (sourceColumnIndex === -1) return;
    
    const leadIndex = updatedColumns[sourceColumnIndex].leads.findIndex(lead => lead.id === leadId);
    if (leadIndex === -1) return;
    
    // Get the lead and update its status
    const lead = { ...updatedColumns[sourceColumnIndex].leads[leadIndex], status: targetColumnId };
    
    // Remove from source column
    updatedColumns[sourceColumnIndex].leads.splice(leadIndex, 1);
    
    // Add to target column
    const targetColumnIndex = updatedColumns.findIndex(col => col.id === targetColumnId);
    if (targetColumnIndex !== -1) {
      updatedColumns[targetColumnIndex].leads.push(lead);
    }
    
    return { updatedColumns, updatedLead: lead };
  };

  const handleDrop = async (e: React.DragEvent, targetColumn: KanbanColumnType) => {
    e.preventDefault();
    
    if (draggedLead && sourceColumn && targetColumn.id !== sourceColumn.id) {
      // Update locally first for smooth UI without triggering loading state
      const result = updateColumnsLocally(draggedLead.id, sourceColumn.id, targetColumn.id);
      if (!result) {
        setDraggedLead(null);
        setSourceColumn(null);
        setIsDragging(false);
        return;
      }
      
      // Manually update the local state with our updated columns
      // This avoids triggering the loading state
      const { updatedLead } = result;
      
      // Update the local leads state
      setLocalLeads(prev => {
        return prev.map(lead => 
          lead.id === draggedLead.id ? updatedLead : lead
        );
      });
      
      try {
        // Update lead status in the database in the background
        const apiUpdatedLead = await updateLead(draggedLead.id, { 
          status: targetColumn.id
        });
        
        // Call the callback to refresh the leads
        if (onLeadUpdate) {
          onLeadUpdate(apiUpdatedLead);
        }
      } catch (error) {
        console.error('Error updating lead status:', error);
        
        // Revert the local change if the API update fails
        setLocalLeads(prev => {
          return prev.map(lead => 
            lead.id === draggedLead.id ? { ...lead, status: sourceColumn.id } : lead
          );
        });
        
        // Manually revert the UI without triggering loading state
        const revertResult = updateColumnsLocally(draggedLead.id, targetColumn.id, sourceColumn.id);
        if (revertResult) {
          // We don't need to do anything with the result here as the useEffect will handle it
        }
      }
    }
    
    setDraggedLead(null);
    setSourceColumn(null);
    setIsDragging(false);
  };

  // Re-fetch boards when leads change
  useEffect(() => {
    // This will refresh the boards when the component receives new leads
    if (!isInitialLoad.current) {
      fetchBoards({ silent: true });
    }
  }, [fetchBoards, localLeads]);

  return (
    <div 
      className={`w-full ${className}`}
      onDragEnd={handleDragEnd}
    >
      {showBoardManager && (
        <KanbanBoardManager 
          boards={columns}
          onAddBoard={addBoard}
          onUpdateBoard={updateBoard}
          onRemoveBoard={removeBoard}
        />
      )}

      {shouldShowLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : boardsError ? (
        <div className="bg-destructive/10 border border-destructive/30 rounded-md p-4 mb-6">
          <p className="text-destructive font-medium">{boardsError}</p>
        </div>
      ) : (
        <div className="flex gap-4 pb-6 pt-2 px-2 w-fit overflow-x-auto overflow-y-hidden h-full">
          {columns.map(column => (
            <KanbanColumn
              key={`${column.id}-${column.leads.length}`} // Use leads length in key to force re-render
              column={column}
              onEditLead={onEditLead}
              onContactLead={onContactLead}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}

      {/* Use our DeleteZone component */}
      <DeleteZone
        visible={isDragging}
        isOver={isOverDeleteZone}
        onDragOver={handleDeleteZoneDragOver}
        onDragLeave={handleDeleteZoneDragLeave}
        onDrop={handleDeleteZoneDrop}
      />
    </div>
  );
}