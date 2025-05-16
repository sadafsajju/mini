'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Kanban, Edit } from 'lucide-react';
import KanbanBoard from '@/components/KanbanBoard';
import LeadSheet from '@/components/LeadSheet';
import { useLeads } from '@/hooks/useLeads';
import { Lead } from '@/types/leads';
import { Header } from '@/components/Header';

export default function LeadsPage() {
  const router = useRouter();
  const { 
    leads, 
    loading, 
    error, 
    searchTerm, 
    setSearchTerm,
    refreshLeads,
    updateLocalLead
  } = useLeads();
  
  const handleEditLead = (id: number) => {
    const lead = leads.find(lead => lead.id === id);
    if (lead) {
      setSelectedLead(lead);
      setIsLeadSheetOpen(true);
    }
  };

  const handleContactLead = (id: number) => {
    router.push(`/leads/${id}/contact`);
  };

  const [selectedLead, setSelectedLead] = useState<Lead | undefined>(undefined);
  const [isLeadSheetOpen, setIsLeadSheetOpen] = useState(false);

  const handleAddNewLead = () => {
    setSelectedLead(undefined);
    setIsLeadSheetOpen(true);
  };
  
  const handleLeadUpdate = (updatedLead: Lead) => {
    updateLocalLead(updatedLead);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container-fluid mx-auto p-4 flex-1 overflow-hidden flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h1 className="text-3xl font-normal">Leads</h1>
        </div>

        <div className="w-full flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center mb-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full sm:w-64 border-none bg-muted"
              />
            </div>

            <div className="flex items-center gap-1 px-3 py-2 rounded-md">
              <Button variant={'ghost'}>
                <Kanban className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex w-full sm:w-auto gap-2">
              <LeadSheet
                isOpen={isLeadSheetOpen}
                onOpenChange={setIsLeadSheetOpen}
                lead={selectedLead}
                onSuccess={(lead) => {
                  refreshLeads();
                }}
                onError={(error) => {
                  // Toast is shown by the component itself
                  console.error('Error with lead operation:', error);
                }}
                trigger={
                  <Button variant={'ghost'} onClick={handleAddNewLead} className="whitespace-nowrap">
                    <Plus className="h-4 w-4" />
                  </Button>
                }
              />
            </div>
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                <p className="text-gray-500">Loading leads...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-md p-4 mb-6">
              <div className="flex flex-col gap-4">
                <p className="text-destructive font-medium">{error}</p>
                <p className="text-muted-foreground text-sm">
                  This could be due to a connection issue or missing Supabase configuration.
                  Please check your Supabase setup and make sure your environment variables are correctly set.
                </p>
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              {leads.length === 0 ? (
                <div className="text-center py-12 bg-muted/50 rounded-lg border">
                  <h3 className="text-xl font-medium mb-2">No leads found</h3>
                  <p className="text-muted-foreground mb-6">
                    Get started by adding your first lead to the system.
                  </p>
                  <Button onClick={handleAddNewLead}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Lead
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-hidden">
                    <KanbanBoard 
                      leads={leads}
                      onLeadUpdate={handleLeadUpdate}
                      onEditLead={handleEditLead}
                      onContactLead={handleContactLead}
                      className="h-full overflow-hidden"
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}