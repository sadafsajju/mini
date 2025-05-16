import React, { useState, useEffect } from 'react';
import { KanbanColumn as KanbanColumnType, Lead, LeadStatus } from '@/types/leads';
import KanbanColumn from './KanbanColumn';
import { updateLead } from '@/lib/api/leads';

interface KanbanBoardProps {
  leads: Lead[];
  onLeadUpdate?: (updatedLead: Lead) => void;
  onEditLead?: (id: number) => void;
  onContactLead?: (id: number) => void;
  className?: string;
}

// Column definitions with colors and titles
const columnDefinitions: Omit<KanbanColumnType, 'leads'>[] = [
  { id: 'new', title: 'New Leads', color: 'blue' },
  { id: 'contacted', title: 'Contacted', color: 'yellow' },
  { id: 'qualified', title: 'Qualified', color: 'green' },
  { id: 'proposal', title: 'Proposal', color: 'purple' },
  { id: 'closed', title: 'Closed', color: 'gray' }
];

export default function KanbanBoard({ 
  leads, 
  onLeadUpdate,
  onEditLead,
  onContactLead,
  className = ''
}: KanbanBoardProps) {
  const [columns, setColumns] = useState<KanbanColumnType[]>([]);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [sourceColumn, setSourceColumn] = useState<KanbanColumnType | null>(null);
  const [localLeads, setLocalLeads] = useState<Lead[]>([]);

  // Keep local state of leads for smooth drag-and-drop even when API updates fail
  useEffect(() => {
    setLocalLeads(leads);
  }, [leads]);

  // Organize leads into columns when leads array changes
  useEffect(() => {
    const newColumns = columnDefinitions.map(column => ({
      ...column,
      leads: localLeads.filter(lead => lead.status === column.id)
    }));
    
    // For leads with no status, put them in the "New" column
    const noStatusLeads = localLeads.filter(lead => !lead.status);
    if (noStatusLeads.length > 0) {
      const newColumnIndex = newColumns.findIndex(column => column.id === 'new');
      if (newColumnIndex !== -1) {
        newColumns[newColumnIndex].leads = [
          ...newColumns[newColumnIndex].leads,
          ...noStatusLeads
        ];
      }
    }
    
    setColumns(newColumns);
  }, [localLeads]);

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
      const updatedLead = { ...draggedLead, status: targetColumn.id as LeadStatus };
      
      setLocalLeads(prev => 
        prev.map(lead => 
          lead.id === draggedLead.id ? updatedLead : lead
        )
      );
      
      try {
        // Update lead status in the database
        const apiUpdatedLead = await updateLead(draggedLead.id, { 
          status: targetColumn.id as LeadStatus
        });
        
        // Call the callback to refresh the leads
        if (onLeadUpdate) {
          onLeadUpdate(apiUpdatedLead);
        }
      } catch (error) {
        console.error('Error updating lead status:', error);
        // If we're in development without the status column, we don't need to display an error
        // The localStorage version will still work for demo purposes
      }
    }
    
    setDraggedLead(null);
    setSourceColumn(null);
  };

  return (
    <div className={`w-full ${className}`}>
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
    </div>
  );
}