'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lead } from '@/types/leads';
import { getLeads, searchLeads } from '@/lib/api/leads';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchLeads = useCallback(async (options?: { silent?: boolean }) => {
    // Only show loading state if not in silent mode and not the initial load
    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const data = await getLeads();
      setLeads(data);
      // Mark initial load as complete
      setIsInitialLoad(false);
    } catch (err) {
      console.error('Error in useLeads hook:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leads');
      // Set empty array to prevent undefined errors in UI
      setLeads([]);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    setSearchTerm(query);
    
    if (!query.trim()) {
      fetchLeads();
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await searchLeads(query);
      setLeads(data);
    } catch (err) {
      console.error('Error in search leads hook:', err);
      setError(err instanceof Error ? err.message : 'Failed to search leads');
      // Set empty array to prevent undefined errors in UI
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [fetchLeads]);

  // Function to update a lead in the local state
  const updateLocalLead = useCallback((updatedLead: Lead) => {
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === updatedLead.id ? updatedLead : lead
      )
    );
  }, []);
  
  // Function to remove a lead from the local state
  const removeLocalLead = useCallback((leadId: number) => {
    setLeads(prevLeads => 
      prevLeads.filter(lead => lead.id !== leadId)
    );
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return {
    leads,
    loading,
    error,
    searchTerm,
    setSearchTerm: handleSearch,
    refreshLeads: fetchLeads,
    updateLocalLead,
    removeLocalLead,
    isInitialLoad
  };
}