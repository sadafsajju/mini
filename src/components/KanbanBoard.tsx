import React, { useState, useEffect } from 'react';
import { KanbanColumn as KanbanColumnType, Lead, LeadStatus } from '@/types/leads';
import KanbanColumn from './KanbanColumn';
import KanbanBoardManager from './KanbanBoardManager';
import { updateLead } from '@/lib/api/leads';
import { useKanbanBoards } from '@/hooks/useKanbanBoards';

interface KanbanBoardProps {
  leads: Lead[];
  onLeadUpdate?: (updatedLead: Lead) => void;
  onEditLead?: (id: number) => void;
  onContactLead?: (id: number) => void;
  className?: string;
}

export default function KanbanBoard({ 
  leads, 
  onLeadUpdate,
  onEditLead,
  onContactLead,
  className = ''
}: KanbanBoardProps) {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [sourceColumn, setSourceColumn] = useState<KanbanColumnType | null>(null);
  const [localLeads, setLocalLeads] = useState<Lead[]>([]);
  const [showBoardManager, setShowBoardManager] = useState(false);
  
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

  // Keep local state of leads for smooth drag-and-drop even when API updates fail
  useEffect(() => {
    setLocalLeads(leads);
  }, [leads]);

  const handleDragStart = (e: React.DragEvent, lead: Lead, column: KanbanColumnType) => {
    setDraggedLead(lead);
    setSourceColumn(column);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetColumn: KanbanColumnType) => {
    e.preventDefault();
    
    if (draggedLead && sourceColumn && targetColumn.id !== sourceColumn.id) {
      // Update locally first for smooth UI
      const updatedLead = { ...draggedLead, status: targetColumn.id };
      
      setLocalLeads(prev => {
        return prev.map(lead => 
          lead.id === draggedLead.id ? updatedLead : lead
        );
      });
      
      try {
        // Update lead status in the database
        const apiUpdatedLead = await updateLead(draggedLead.id, { 
          status: targetColumn.id
        });
        
        // Call the callback to refresh the leads
        if (onLeadUpdate) {
          onLeadUpdate(apiUpdatedLead);
        }
        
        // Force a refresh of the boards
        fetchBoards();
      } catch (error) {
        console.error('Error updating lead status:', error);
        // If we're in development without the status column, we don't need to display an error
        // The localStorage version will still work for demo purposes
      }
    }
    
    setDraggedLead(null);
    setSourceColumn(null);
  };

  // Toggle board manager visibility
  const toggleBoardManager = () => {
    setShowBoardManager(!showBoardManager);
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-4">
        <button 
          onClick={toggleBoardManager}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          {showBoardManager ? 'Hide Board Manager' : 'Manage Boards'}
        </button>
      </div>

      {showBoardManager && (
        <KanbanBoardManager 
          boards={columns}
          onAddBoard={addBoard}
          onUpdateBoard={updateBoard}
          onRemoveBoard={removeBoard}
        />
      )}

      {boardsLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : boardsError ? (
        <div className="bg-destructive/10 border border-destructive/30 rounded-md p-4 mb-6">
          <p className="text-destructive font-medium">{boardsError}</p>
        </div>
      ) : (
        <div className="flex gap-4 pb-6 pt-2 px-2 w-fit overflow-x-auto overflow-y-hidden">
          {columns.map(column => (
            <KanbanColumn
              key={column.id}
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
    </div>
  );
}