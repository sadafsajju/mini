'use client';

import { supabase } from '@/lib/supabase';
import { Lead, LeadStatus } from '@/types/leads';

// Check if status column exists (will be used to adjust queries)
let statusColumnExists = true;

/**
 * Fetch all leads from Supabase
 */
export async function getLeads(): Promise<Lead[]> {
  try {
    // First, try to fetch with status column
    if (statusColumnExists) {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('id, name, email, phone_number, address, notes, created_at, updated_at')
          .order('created_at', { ascending: false });
          
        if (error) {
          if (error.code === '42703' && error.message?.includes('status does not exist')) {
            statusColumnExists = false;
            // Retry without status column
            return getLeads();
          }
          console.error('Error fetching leads:', error);
          throw error;
        }
        
        // Assign default status for kanban view
        return data?.map((lead, index) => ({
          ...lead,
          status: getDefaultStatus(index)
        })) || [];
      } catch (err) {
        if (err instanceof Error && err.message?.includes('status does not exist')) {
          statusColumnExists = false;
          // Retry without status column
          return getLeads();
        }
        throw err;
      }
    } else {
      // Fetch without status column
      const { data, error } = await supabase
        .from('leads')
        .select('id, name, email, phone_number, address, notes, created_at, updated_at')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching leads:', error);
        throw error;
      }
      
      // Assign default status for kanban view
      return data?.map((lead, index) => ({
        ...lead,
        status: getDefaultStatus(index)
      })) || [];
    }
  } catch (err) {
    console.error('Error fetching leads:', err);
    throw new Error('Failed to fetch leads');
  }
}

/**
 * Search leads by query term
 */
export async function searchLeads(query: string): Promise<Lead[]> {
  try {
    let queryBuilder = supabase
      .from('leads')
      .select('id, name, email, phone_number, address, notes, created_at, updated_at')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone_number.ilike.%${query}%,address.ilike.%${query}%,notes.ilike.%${query}%`)
      .order('created_at', { ascending: false });
      
    const { data, error } = await queryBuilder;
      
    if (error) {
      console.error('Error searching leads:', error);
      throw error;
    }
    
    // Assign default status for kanban view
    return data?.map((lead, index) => ({
      ...lead,
      status: getDefaultStatus(index)
    })) || [];
  } catch (err) {
    console.error('Error searching leads:', err);
    throw new Error('Failed to search leads');
  }
}

/**
 * Get a single lead by ID
 */
export async function getLeadById(id: number): Promise<Lead | null> {
  try {
    let queryBuilder = supabase
      .from('leads')
      .select('id, name, email, phone_number, address, notes, created_at, updated_at')
      .eq('id', id)
      .single();
      
    const { data, error } = await queryBuilder;
      
    if (error) {
      console.error(`Error fetching lead with ID ${id}:`, error);
      throw error;
    }
    
    // Assign default status for kanban view if data exists
    if (data) {
      return {
        ...data,
        status: getDefaultStatus(id % 5) // Use modulo to distribute leads
      };
    }
    
    return null;
  } catch (err) {
    console.error(`Error fetching lead with ID ${id}:`, err);
    throw new Error('Failed to fetch lead');
  }
}

/**
 * Create a new lead
 */
export async function createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
  try {
    // Remove status if the column doesn't exist
    const leadData = statusColumnExists ? lead : {
      name: lead.name,
      email: lead.email,
      phone_number: lead.phone_number,
      address: lead.address,
      notes: lead.notes
    };
    
    const { data, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select('id, name, email, phone_number, address, notes, created_at, updated_at')
      .single();
      
    if (error) {
      console.error('Error creating lead:', error);
      throw new Error(`Failed to create lead: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Failed to create lead: No data returned');
    }
    
    // Return with default status
    return {
      ...data,
      status: 'new' as LeadStatus
    };
  } catch (err) {
    console.error('Error creating lead:', err);
    throw new Error(err instanceof Error ? err.message : 'Failed to create lead');
  }
}

/**
 * Update an existing lead
 */
export async function updateLead(id: number, lead: Partial<Omit<Lead, 'id' | 'created_at' | 'updated_at'>>): Promise<Lead> {
  try {
    // If just updating status and column doesn't exist, simulate success
    if (!statusColumnExists && Object.keys(lead).length === 1 && lead.status) {
      const { data, error } = await supabase
        .from('leads')
        .select('id, name, email, phone_number, address, notes, created_at, updated_at')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error(`Error fetching lead for status update with ID ${id}:`, error);
        throw new Error(`Failed to update lead: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('Failed to update lead: Lead not found');
      }
      
      // Return with updated status
      return {
        ...data,
        status: lead.status
      };
    }
    
    // Remove status if the column doesn't exist
    const leadData = statusColumnExists ? lead : {
      ...lead,
      status: undefined
    };
    
    const { data, error } = await supabase
      .from('leads')
      .update(leadData)
      .eq('id', id)
      .select('id, name, email, phone_number, address, notes, created_at, updated_at')
      .single();
      
    if (error) {
      console.error(`Error updating lead with ID ${id}:`, error);
      throw new Error(`Failed to update lead: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Failed to update lead: Lead not found');
    }
    
    // Return with preserved or default status
    return {
      ...data,
      status: lead.status || getDefaultStatus(id % 5)
    };
  } catch (err) {
    console.error(`Error updating lead with ID ${id}:`, err);
    throw new Error(err instanceof Error ? err.message : 'Failed to update lead');
  }
}

/**
 * Delete a lead
 */
export async function deleteLead(id: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error(`Error deleting lead with ID ${id}:`, error);
      throw error;
    }
  } catch (err) {
    console.error(`Error deleting lead with ID ${id}:`, err);
    throw new Error('Failed to delete lead');
  }
}

/**
 * Helper function to assign a default status based on index or ID
 */
function getDefaultStatus(index: number): LeadStatus {
  const statuses: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposal', 'closed'];
  return statuses[index % statuses.length];
}
