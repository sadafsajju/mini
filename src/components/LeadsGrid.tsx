import React from 'react';
import LeadCard from './LeadCard';
import { Lead } from '@/types/supabase';

interface LeadsGridProps {
  leads: Lead[];
  onEditLead?: (id: number) => void;
  onContactLead?: (id: number) => void;
}

export const LeadsGrid: React.FC<LeadsGridProps> = ({
  leads,
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
      {leads.map((lead) => (
        <LeadCard 
          key={lead.id} 
          lead={lead} 
          onEdit={onEditLead}
          onContact={onContactLead}
        />
      ))}
    </div>
  );
};

export default LeadsGrid;