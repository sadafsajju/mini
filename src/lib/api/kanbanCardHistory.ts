'use client';

import { supabase } from '@/lib/supabase';

/**
 * Interface for kanban card history entry
 */
export interface KanbanCardHistory {
  id: string;
  lead_id: number;
  from_column: string;
  to_column: string;
  from_column_title: string | null;
  to_column_title: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

/**
 * Create a new history entry for a card movement
 */
export async function createCardMovementHistory(
  leadId: number,
  fromColumn: string,
  toColumn: string,
  notes?: string,
  fromColumnTitle?: string,
  toColumnTitle?: string
): Promise<KanbanCardHistory> {
  try {
    const { data, error } = await supabase
      .from('kanban_card_history')
      .insert({
        lead_id: leadId,
        from_column: fromColumn,
        to_column: toColumn,
        from_column_title: fromColumnTitle || null,
        to_column_title: toColumnTitle || null,
        notes: notes || null
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating card movement history:', error);
      throw new Error(`Failed to create movement history: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to create movement history: No data returned');
    }

    return data as KanbanCardHistory;
  } catch (err) {
    console.error('Error creating card movement history:', err);
    throw new Error(err instanceof Error ? err.message : 'Failed to create movement history');
  }
}

/**
 * Get history for a specific card
 */
export async function getCardHistory(leadId: number): Promise<KanbanCardHistory[]> {
  try {
    const { data, error } = await supabase
      .from('kanban_card_history')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching history for lead ID ${leadId}:`, error);
      throw error;
    }

    return data as KanbanCardHistory[] || [];
  } catch (err) {
    console.error(`Error fetching history for lead ID ${leadId}:`, err);
    throw new Error('Failed to fetch card history');
  }
}

/**
 * Delete all history entries for a card
 * Note: This should not be necessary with the ON DELETE CASCADE constraint,
 * but is provided as a fallback if needed.
 */
export async function deleteCardHistory(leadId: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('kanban_card_history')
      .delete()
      .eq('lead_id', leadId);

    if (error) {
      console.error(`Error deleting history for lead ID ${leadId}:`, error);
      throw error;
    }
  } catch (err) {
    console.error(`Error deleting history for lead ID ${leadId}:`, err);
    throw new Error('Failed to delete card history');
  }
}
