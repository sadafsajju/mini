export type LeadStatus = string;
export type LeadPriority = 'low' | 'medium' | 'high';

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  address: string;
  notes: string;
  status?: LeadStatus;
  priority?: LeadPriority;
  created_at?: string;
  updated_at?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  leads: Lead[];
  position?: number;
}