'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lead } from '@/types/leads';
import { getLeads, searchLeads } from '@/lib/api/leads';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getLeads();
      setLeads(data);
    } catch (err) {
      console.error('Error in useLeads hook:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leads');
      // Set empty array to prevent undefined errors in UI
      setLeads([]);
    } finally {
      setLoading(false);
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
    updateLocalLead
  };
}
