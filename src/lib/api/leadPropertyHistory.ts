'use client';

import { supabase } from '@/lib/supabase';

/**
 * Interface for lead property change history entry
 */
export interface LeadPropertyHistory {
  id: string;
  lead_id: number;
  property_name: string;
  from_value: string | null;
  to_value: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

/**
 * Create a new history entry for a lead property change
 */
export async function createPropertyChangeHistory(
  leadId: number,
  propertyName: string,
  fromValue: string | null,
  toValue: string | null,
  notes?: string
): Promise<LeadPropertyHistory> {
  try {
    const { data, error } = await supabase
      .from('lead_property_history')
      .insert({
        lead_id: leadId,
        property_name: propertyName,
        from_value: fromValue,
        to_value: toValue,
        notes: notes || null
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating property change history:', error);
      // If table doesn't exist, create a fallback record in the kanban_card_history table
      if (error.code === '42P01') {
        console.warn('Lead property history table does not exist, using fallback');
        // Use kanban_card_history as a fallback
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('kanban_card_history')
          .insert({
            lead_id: leadId,
            from_column: `${propertyName}:${fromValue || 'none'}`,
            to_column: `${propertyName}:${toValue || 'none'}`,
            from_column_title: fromValue || 'none',
            to_column_title: toValue || 'none',
            notes: `${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)} changed: ${notes || ''}`
          })
          .select('*')
          .single();
          
        if (fallbackError) {
          throw new Error(`Failed to create property history (fallback): ${fallbackError.message}`);
        }
        
        return {
          id: fallbackData.id,
          lead_id: fallbackData.lead_id,
          property_name: propertyName,
          from_value: fromValue,
          to_value: toValue,
          notes: notes || null,
          created_at: fallbackData.created_at,
          created_by: fallbackData.created_by
        };
      }
      
      throw new Error(`Failed to create property history: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to create property history: No data returned');
    }

    return data as LeadPropertyHistory;
  } catch (err) {
    console.error('Error creating property change history:', err);
    throw new Error(err instanceof Error ? err.message : 'Failed to create property history');
  }
}

/**
 * Get property change history for a specific lead
 */
export async function getPropertyHistory(leadId: number, propertyName?: string): Promise<LeadPropertyHistory[]> {
  try {
    let query = supabase
      .from('lead_property_history')
      .select('*')
      .eq('lead_id', leadId);
      
    if (propertyName) {
      query = query.eq('property_name', propertyName);
    }
      
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01') {
        console.warn('Lead property history table does not exist');
        return [];
      }
      
      console.error(`Error fetching property history for lead ID ${leadId}:`, error);
      throw error;
    }

    return data as LeadPropertyHistory[] || [];
  } catch (err) {
    console.error(`Error fetching property history for lead ID ${leadId}:`, err);
    throw new Error('Failed to fetch property history');
  }
}
