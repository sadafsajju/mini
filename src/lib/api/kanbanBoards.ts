'use client';

import { supabase } from '@/lib/supabase';
import { KanbanColumn } from '@/types/leads';

/**
 * Fetch all kanban boards from Supabase
 */
export async function getKanbanBoards(): Promise<Omit<KanbanColumn, 'leads'>[]> {
  try {
    const { data, error } = await supabase
      .from('kanban_boards')
      .select('id, title, color')
      .order('position', { ascending: true });
      
    if (error) {
      console.error('Error fetching kanban boards:', error);
      throw error;
    }
    
    return data || [];
  } catch (err) {
    console.error('Error fetching kanban boards:', err);
    
    // If the table doesn't exist yet, return default boards
    if (err instanceof Error && err.message?.includes('does not exist')) {
      return getDefaultBoards();
    }
    
    throw new Error('Failed to fetch kanban boards');
  }
}

/**
 * Create a new kanban board
 */
export async function createKanbanBoard(board: Omit<KanbanColumn, 'leads' | 'id'>): Promise<Omit<KanbanColumn, 'leads'>> {
  try {
    // Get the current highest position
    const { data: existingBoards } = await supabase
      .from('kanban_boards')
      .select('position')
      .order('position', { ascending: false })
      .limit(1);
    
    const nextPosition = existingBoards && existingBoards.length > 0 ? 
      (existingBoards[0].position + 1) : 0;
    
    const { data, error } = await supabase
      .from('kanban_boards')
      .insert({
        title: board.title,
        color: board.color,
        position: nextPosition
      })
      .select('id, title, color')
      .single();
      
    if (error) {
      console.error('Error creating kanban board:', error);
      throw new Error(`Failed to create kanban board: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Failed to create kanban board: No data returned');
    }
    
    return data;
  } catch (err) {
    console.error('Error creating kanban board:', err);
    throw new Error(err instanceof Error ? err.message : 'Failed to create kanban board');
  }
}

/**
 * Update an existing kanban board
 */
export async function updateKanbanBoard(id: string, board: Partial<Omit<KanbanColumn, 'leads' | 'id'>>): Promise<Omit<KanbanColumn, 'leads'>> {
  try {
    const { data, error } = await supabase
      .from('kanban_boards')
      .update(board)
      .eq('id', id)
      .select('id, title, color')
      .single();
      
    if (error) {
      console.error(`Error updating kanban board with ID ${id}:`, error);
      throw new Error(`Failed to update kanban board: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Failed to update kanban board: Board not found');
    }
    
    return data;
  } catch (err) {
    console.error(`Error updating kanban board with ID ${id}:`, err);
    throw new Error(err instanceof Error ? err.message : 'Failed to update kanban board');
  }
}

/**
 * Delete a kanban board
 */
export async function deleteKanbanBoard(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('kanban_boards')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error(`Error deleting kanban board with ID ${id}:`, error);
      throw error;
    }
  } catch (err) {
    console.error(`Error deleting kanban board with ID ${id}:`, err);
    throw new Error('Failed to delete kanban board');
  }
}

/**
 * Update the positions of multiple kanban boards
 */
export async function updateKanbanBoardPositions(boards: { id: string, position: number }[]): Promise<void> {
  try {
    // Try using RPC function first
    try {
      const { error } = await supabase.rpc('update_kanban_board_positions', {
        boards_data: boards
      });
      
      if (!error) {
        // RPC worked, return early
        return;
      }
    } catch {
      // RPC failed, will fall back to individual updates
      console.log('RPC not available, falling back to individual updates');
    }

    // Individual updates as fallback
    for (const board of boards) {
      const { error } = await supabase
        .from('kanban_boards')
        .update({ position: board.position })
        .eq('id', board.id);
        
      if (error) {
        console.error(`Error updating position for board ${board.id}:`, error);
        throw error;
      }
    }
  } catch (err) {
    console.error('Error updating kanban board positions:', err);
    throw new Error('Failed to update kanban board positions');
  }
}

/**
 * Get default kanban boards (used when the table doesn't exist yet)
 */
export function getDefaultBoards(): Omit<KanbanColumn, 'leads'>[] {
  return [
    { id: 'new', title: 'New Leads', color: 'blue' },
    { id: 'contacted', title: 'Contacted', color: 'yellow' },
    { id: 'qualified', title: 'Qualified', color: 'green' },
    { id: 'proposal', title: 'Proposal', color: 'purple' },
    { id: 'closed', title: 'Closed', color: 'gray' }
  ];
}
