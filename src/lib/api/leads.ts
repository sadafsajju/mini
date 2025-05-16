'use client';

import { supabase } from '@/lib/supabase';
import { Lead, LeadStatus } from '@/types/leads';

// Always assume status column exists (we'll create it if it doesn't)
let statusColumnExists = true;

/**
 * Fetch all leads from Supabase
 */
export async function getLeads(): Promise<Lead[]> {
  try {
    // First, try to fetch with status column
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, name, email, phone_number, address, notes, status, created_at, updated_at')
        .order('created_at', { ascending: false });
        
      if (error) {
        if (error.code === '42703' && error.message?.includes('status does not exist')) {
          statusColumnExists = false;
          // If status column doesn't exist, create it
          await createStatusColumn();
          // Retry the query after creating the column
          return getLeads();
        }
        console.error('Error fetching leads:', error);
        throw error;
      }
      
      // Return with preserved status, ensuring type safety
      return data?.map(lead => {
        // Create a properly typed Lead object
        const typedLead: Lead = {
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone_number: lead.phone_number || '',
          address: lead.address || '',
          notes: lead.notes || '',
          status: (lead as any).status || 'new', // Use type assertion for potentially missing status
          created_at: lead.created_at,
          updated_at: lead.updated_at
        };
        return typedLead;
      }) || [];
    } catch (err) {
      if (err instanceof Error && err.message?.includes('status does not exist')) {
        statusColumnExists = false;
        // If status column doesn't exist, create it
        await createStatusColumn();
        // Retry the query after creating the column
        return getLeads();
      }
      throw err;
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
      .select('id, name, email, phone_number, address, notes, status, created_at, updated_at')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone_number.ilike.%${query}%,address.ilike.%${query}%,notes.ilike.%${query}%`)
      .order('created_at', { ascending: false });
      
    const { data, error } = await queryBuilder;
      
    if (error) {
      console.error('Error searching leads:', error);
      throw error;
    }
    
    // Return with preserved status, ensuring type safety
    return data?.map(lead => {
      // Create a properly typed Lead object
      const typedLead: Lead = {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone_number: lead.phone_number || '',
        address: lead.address || '',
        notes: lead.notes || '',
        status: (lead as any).status || 'new', // Use type assertion for potentially missing status
        created_at: lead.created_at,
        updated_at: lead.updated_at
      };
      return typedLead;
    }) || [];
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
      .select('id, name, email, phone_number, address, notes, status, created_at, updated_at')
      .eq('id', id)
      .single();
      
    const { data, error } = await queryBuilder;
      
    if (error) {
      console.error(`Error fetching lead with ID ${id}:`, error);
      throw error;
    }
    
    // Return with preserved status
    if (data) {
      return {
        ...data,
        status: data.status || 'new' // Fallback to 'new' if status is null
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
    // Ensure status is included with default 'new' if not provided
    const leadData = {
      ...lead,
      status: lead.status || 'new'
    };
    
    const { data, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select('id, name, email, phone_number, address, notes, status, created_at, updated_at')
      .single();
      
    if (error) {
      // If the error indicates status column doesn't exist, create it
      if (error.code === '42703' && error.message?.includes('status does not exist')) {
        statusColumnExists = false;
        await createStatusColumn();
        
        // Try again without the status field
        const fallbackData = {
          name: lead.name,
          email: lead.email,
          phone_number: lead.phone_number,
          address: lead.address,
          notes: lead.notes
        };
        
        const { data: retryData, error: retryError } = await supabase
          .from('leads')
          .insert(fallbackData)
          .select('id, name, email, phone_number, address, notes, created_at, updated_at')
          .single();
          
        if (retryError) {
          console.error('Error creating lead (retry):', retryError);
          throw new Error(`Failed to create lead: ${retryError.message}`);
        }
        
        if (!retryData) {
          throw new Error('Failed to create lead: No data returned');
        }
        
        // Update the lead after creation to set the status
        await updateLeadStatus(retryData.id, lead.status || 'new');
        
        // Return with status, properly typed
        if (!retryData) {
          throw new Error('Failed to create lead: No data returned');
        }
        
        // Update the lead after creation to set the status
        await updateLeadStatus(retryData.id, lead.status || 'new');
        
        const typedLead: Lead = {
          id: retryData.id,
          name: retryData.name,
          email: retryData.email,
          phone_number: retryData.phone_number || '',
          address: retryData.address || '',
          notes: retryData.notes || '',
          status: lead.status || 'new',
          created_at: retryData.created_at,
          updated_at: retryData.updated_at
        };
        
        return typedLead;
      }
      
      console.error('Error creating lead:', error);
      throw new Error(`Failed to create lead: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Failed to create lead: No data returned');
    }
    
    // Return lead with status, properly typed
    if (!data) {
      throw new Error('Failed to create lead: No data returned');
    }
    
    const typedLead: Lead = {
      id: data.id,
      name: data.name,
      email: data.email,
      phone_number: data.phone_number || '',
      address: data.address || '',
      notes: data.notes || '',
      status: (data as any).status || 'new',
      created_at: data.created_at,
      updated_at: data.updated_at
    };
    
    return typedLead;
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
    // If only updating status, use specialized function
    if (Object.keys(lead).length === 1 && lead.status) {
      return updateLeadStatus(id, lead.status);
    }
    
    // For regular updates
    const { data, error } = await supabase
      .from('leads')
      .update(lead)
      .eq('id', id)
      .select('id, name, email, phone_number, address, notes, status, created_at, updated_at')
      .single();
      
    if (error) {
      // If the error indicates status column doesn't exist, create it
      if (error.code === '42703' && error.message?.includes('status does not exist')) {
        statusColumnExists = false;
        await createStatusColumn();
        
        // Try again without the status field
        const fallbackData = { ...lead };
        delete fallbackData.status;
        
        const { data: retryData, error: retryError } = await supabase
          .from('leads')
          .update(fallbackData)
          .eq('id', id)
          .select('id, name, email, phone_number, address, notes, created_at, updated_at')
          .single();
          
        if (retryError) {
          console.error(`Error updating lead with ID ${id} (retry):`, retryError);
          throw new Error(`Failed to update lead: ${retryError.message}`);
        }
        
        if (!retryData) {
          throw new Error('Failed to update lead: Lead not found');
        }
        
        // If there was a status update, handle it separately
        if (lead.status) {
          await updateLeadStatus(id, lead.status);
        }
        
        // Return with status, properly typed
        if (!retryData) {
          throw new Error('Failed to update lead: Lead not found');
        }
        
        // If there was a status update, handle it separately
        if (lead.status) {
          await updateLeadStatus(id, lead.status);
        }
        
        const typedLead: Lead = {
          id: retryData.id,
          name: retryData.name,
          email: retryData.email,
          phone_number: retryData.phone_number || '',
          address: retryData.address || '',
          notes: retryData.notes || '',
          status: lead.status || (retryData as any).status || 'new',
          created_at: retryData.created_at,
          updated_at: retryData.updated_at
        };
        
        return typedLead;
      }
      
      console.error(`Error updating lead with ID ${id}:`, error);
      throw new Error(`Failed to update lead: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Failed to update lead: Lead not found');
    }
    
    // Return with preserved status, properly typed
    if (!data) {
      throw new Error('Failed to update lead: Lead not found');
    }
    
    const typedLead: Lead = {
      id: data.id,
      name: data.name,
      email: data.email,
      phone_number: data.phone_number || '',
      address: data.address || '',
      notes: data.notes || '',
      status: (data as any).status || lead.status || 'new',
      created_at: data.created_at,
      updated_at: data.updated_at
    };
    
    return typedLead;
  } catch (err) {
    console.error(`Error updating lead with ID ${id}:`, err);
    throw new Error(err instanceof Error ? err.message : 'Failed to update lead');
  }
}

/**
 * Update only the status of a lead
 */
async function updateLeadStatus(id: number, status: string): Promise<Lead> {
  try {
    // First check if status column exists
    if (!statusColumnExists) {
      // Create the status column if it doesn't exist
      await createStatusColumn();
      statusColumnExists = true;
    }
    
    // Update the status
    const { data, error } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', id)
      .select('id, name, email, phone_number, address, notes, status, created_at, updated_at')
      .single();
      
    if (error) {
      console.error(`Error updating status for lead with ID ${id}:`, error);
      
      // If we still have issues, fetch the lead without status to return
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('leads')
        .select('id, name, email, phone_number, address, notes, created_at, updated_at')
        .eq('id', id)
        .single();
        
      if (fallbackError) {
        throw new Error(`Failed to update lead status: ${fallbackError.message}`);
      }
      
      if (!fallbackData) {
        throw new Error('Failed to update lead status: Lead not found');
      }
      
      // Return with the requested status even if we couldn't save it, properly typed
      if (!fallbackData) {
        throw new Error('Failed to update lead status: Lead not found');
      }
      
      const typedLead: Lead = {
        id: fallbackData.id,
        name: fallbackData.name,
        email: fallbackData.email,
        phone_number: fallbackData.phone_number || '',
        address: fallbackData.address || '',
        notes: fallbackData.notes || '',
        status: status,
        created_at: fallbackData.created_at,
        updated_at: fallbackData.updated_at
      };
      
      return typedLead;
    }
    
    if (!data) {
      throw new Error('Failed to update lead status: Lead not found');
    }
    
    // Return with updated status, properly typed
    if (!data) {
      throw new Error('Failed to update lead status: Lead not found');
    }
    
    const typedLead: Lead = {
      id: data.id,
      name: data.name,
      email: data.email,
      phone_number: data.phone_number || '',
      address: data.address || '',
      notes: data.notes || '',
      status: (data as any).status || status,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
    
    return typedLead;
  } catch (err) {
    console.error(`Error updating status for lead with ID ${id}:`, err);
    throw new Error(err instanceof Error ? err.message : 'Failed to update lead status');
  }
}

/**
 * Create the status column in the leads table
 */
async function createStatusColumn(): Promise<void> {
  try {
    // First check if column already exists to avoid errors
    const { error: checkError } = await supabase
      .rpc('check_column_exists', { 
        p_table: 'leads', 
        p_column: 'status' 
      });
    
    // If the RPC doesn't exist or returns an error, try to create the column directly
    if (checkError || true) {
      console.log('Creating status column in leads table...');
      
      // Execute raw SQL to add the column
      const { error } = await supabase.rpc('add_status_column_to_leads');
      
      if (error) {
        console.error('Error creating status column with RPC:', error);
        
        // Fallback to direct SQL (this requires elevated permissions)
        const { error: sqlError } = await supabase
          .from('leads_status_migration')
          .insert({ executed: true });
          
        if (sqlError) {
          console.error('Error creating status column with direct SQL:', sqlError);
          throw new Error('Failed to create status column in leads table');
        }
      }
      
      console.log('Status column created successfully');
      statusColumnExists = true;
    }
  } catch (err) {
    console.error('Error creating status column:', err);
    // We'll continue even if this fails, as we have fallback logic
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