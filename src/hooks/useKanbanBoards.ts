'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { KanbanColumn, Lead } from '@/types/leads';
import { 
  getKanbanBoards, 
  createKanbanBoard, 
  updateKanbanBoard, 
  deleteKanbanBoard,
  updateKanbanBoardPositions
} from '@/lib/api/kanbanBoards';

export function useKanbanBoards(leads: Lead[]) {
  const [boards, setBoards] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const leadsRef = useRef(leads);

  // Update the ref when leads change
  useEffect(() => {
    leadsRef.current = leads;
  }, [leads]);

  // Helper function to organize leads into boards
  const organizeLeadsIntoBoards = useCallback((boardsData: Omit<KanbanColumn, 'leads'>[], leadsData: Lead[]) => {
    // Create a map of board IDs to make lookup faster
    const boardMap = new Map(boardsData.map(board => [board.id, board]));
    
    // Create a deep copy of leads to avoid modifying the original array
    const leadsWithCorrectStatus = leadsData.map(lead => ({
      ...lead,
    }));
    
    // Organize leads into columns
    const boardsWithLeads = boardsData.map(board => ({
      ...board,
      leads: leadsWithCorrectStatus.filter(lead => lead.status === board.id)
    }));
    
    // For leads with no status or status that doesn't match any board, put them in the first board
    const orphanedLeads = leadsWithCorrectStatus.filter(lead => 
      !lead.status || !boardMap.has(lead.status)
    );
    
    if (orphanedLeads.length > 0 && boardsWithLeads.length > 0) {
      // Add orphaned leads to the first board
      boardsWithLeads[0].leads = [
        ...boardsWithLeads[0].leads,
        ...orphanedLeads
      ];
    }
    
    return boardsWithLeads;
  }, []);

  // Fetch boards from the API
  const fetchBoards = useCallback(async (options?: { silent?: boolean }) => {
    try {
      // Only show loading state if not in silent mode
      if (!options?.silent) {
        setLoading(true);
      }
      setError(null);
      
      const boardsData = await getKanbanBoards();
      const boardsWithLeads = organizeLeadsIntoBoards(boardsData, leadsRef.current);
      
      setBoards(boardsWithLeads);
    } catch (err) {
      console.error('Error fetching kanban boards:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch kanban boards');
    } finally {
      setLoading(false);
    }
  }, [organizeLeadsIntoBoards]);

  // Track initial mount to avoid showing loading spinner on every leads change
  const isInitialMount = useRef(true);

  // Initial fetch
  useEffect(() => {
    if (isInitialMount.current) {
      // On initial mount, show loading spinner
      fetchBoards();
      isInitialMount.current = false;
    } else {
      // On subsequent updates to leads, don't show loading spinner
      fetchBoards({ silent: true });
    }
  }, [fetchBoards, leads]);

  // Add a new board
  const addBoard = useCallback(async (board: Omit<KanbanColumn, 'leads' | 'id'>) => {
    try {
      setError(null);
      setLoading(true);
      
      // Create the board in the database
      const newBoard = await createKanbanBoard(board);
      
      // Create the new board with leads array
      const newBoardWithLeads = {
        ...newBoard,
        leads: []
      };
      
      // Update the local state immediately with the new board
      setBoards(prev => [...prev, newBoardWithLeads]);
      
      // Force a refresh to ensure everything is in sync
      setTimeout(() => {
        fetchBoards({ silent: true });
      }, 100);
      
      setLoading(false);
      return newBoard;
    } catch (err) {
      console.error('Error adding kanban board:', err);
      setError(err instanceof Error ? err.message : 'Failed to add kanban board');
      setLoading(false);
      throw err;
    }
  }, [fetchBoards]);

  // Update a board
  const updateBoard = useCallback(async (id: string, board: Partial<Omit<KanbanColumn, 'leads' | 'id'>>) => {
    try {
      setError(null);
      const updatedBoard = await updateKanbanBoard(id, board);
      
      // Immediately update the local state
      setBoards(prev => 
        prev.map(b => 
          b.id === id ? { ...b, ...updatedBoard } : b
        )
      );
      
      // Force a refresh to ensure everything is in sync
      setTimeout(() => {
        fetchBoards({ silent: true });
      }, 100);
      
      return updatedBoard;
    } catch (err) {
      console.error(`Error updating kanban board with ID ${id}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to update kanban board');
      throw err;
    }
  }, [fetchBoards]);

  // Remove a board
  const removeBoard = useCallback(async (id: string) => {
    try {
      setError(null);
      await deleteKanbanBoard(id);
      
      // Immediately update the local state
      setBoards(prev => prev.filter(b => b.id !== id));
      
      // Force a refresh to ensure everything is in sync
      setTimeout(() => {
        fetchBoards({ silent: true });
      }, 100);
    } catch (err) {
      console.error(`Error removing kanban board with ID ${id}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to remove kanban board');
      throw err;
    }
  }, [fetchBoards]);

  // Reorder boards
  const reorderBoards = useCallback(async (reorderedBoards: KanbanColumn[]) => {
    try {
      setError(null);
      
      // Update local state immediately for a smooth UI experience
      setBoards(reorderedBoards);
      
      // Prepare data for the API call
      const positionUpdates = reorderedBoards.map((board, index) => ({
        id: board.id,
        position: index
      }));
      
      // Update positions in the database
      await updateKanbanBoardPositions(positionUpdates);
    } catch (err) {
      console.error('Error reordering kanban boards:', err);
      setError(err instanceof Error ? err.message : 'Failed to reorder kanban boards');
      
      // Refresh boards on error to ensure UI is in sync with the database
      fetchBoards();
      throw err;
    }
  }, [fetchBoards]);

  return {
    boards,
    loading,
    error,
    fetchBoards,
    addBoard,
    updateBoard,
    removeBoard,
    reorderBoards
  };
}