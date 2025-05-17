import React from 'react';
import LeadCard from './LeadCard';
import { Lead, KanbanColumn } from '@/types/leads';

interface LeadsGridProps {
  leads: Lead[];
  boards?: KanbanColumn[];
  onEditLead?: (id: number) => void;
  onContactLead?: (id: number) => void;
}

export const LeadsGrid: React.FC<LeadsGridProps> = ({
  leads,
  boards = [],
  onEditLead,
  onContactLead
}) => {
  if (leads.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No leads found. Try adjusting your search or add new leads.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {leads.map((lead) => {
        // Find the board that contains this lead
        const board = boards.find(board => board.id === lead.status);
        
        return (
          <LeadCard 
            key={lead.id} 
            lead={lead} 
            onEdit={onEditLead}
            onContact={onContactLead}
            boardTitle={board?.title}
            boardColor={board?.color}
          />
        );
      })}
    </div>
  );
};

export default LeadsGrid;