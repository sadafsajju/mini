export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed';

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  address: string;
  notes: string;
  status?: LeadStatus;
  created_at?: string;
  updated_at?: string;
}

export interface KanbanColumn {
  id: LeadStatus;
  title: string;
  color: string;
  leads: Lead[];
}