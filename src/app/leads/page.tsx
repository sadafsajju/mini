'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Kanban, Edit, Settings } from 'lucide-react';
import KanbanBoard from '@/components/KanbanBoard';
import LeadSheet from '@/components/LeadSheet';
import KanbanBoardManagerSheet from '@/components/KanbanBoardManagerSheet';
import { useLeads } from '@/hooks/useLeads';
import { Lead } from '@/types/leads';
import { Header } from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { useKanbanBoards } from '@/hooks/useKanbanBoards';

export default function LeadsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLeadSheetOpen, setIsLeadSheetOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | undefined>(undefined);
  const [isKanbanManagerOpen, setIsKanbanManagerOpen] = useState(false);
  const {
    leads,
    loading: leadsLoading,
    error: leadsError,
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

  const handleAddNewLead = () => {
    setSelectedLead(undefined);
    setIsLeadSheetOpen(true);
  };
  
  // Get kanban boards data using the hook
  const {
    boards,
    loading: boardsLoading,
    error: boardsError,
    addBoard,
    updateBoard,
    removeBoard
  } = useKanbanBoards(leads);
  
  const toggleKanbanManager = () => {
    setIsKanbanManagerOpen(!isKanbanManagerOpen);
  };
  
  const handleLeadUpdate = (updatedLead: Lead) => {
    updateLocalLead(updatedLead);
  };

  // Skeleton card component for loading state
  const SkeletonCard = () => (
    <div className="mb-3 shadow-none border bg-card/30 dark:bg-card/20 dark:border-muted/20 rounded-xl p-3">
      <div className="flex flex-col space-y-2">
        <Skeleton className="h-5 w-3/4 rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
        <div className="flex items-center gap-2 mt-1">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-1/2 rounded-md" />
        </div>
      </div>
    </div>
  );

  // Skeleton column component for loading state
  const SkeletonColumn = () => (
    <div className="bg-muted/60 dark:bg-muted/20 rounded-2xl min-w-64 w-72 flex-shrink-0 h-[calc(100vh-11rem)] flex flex-col">
      <div className="flex items-center justify-between mb-3 px-4 pt-3">
        <div className="flex items-center">
          <Skeleton className="w-2 h-2 rounded-full mr-2" />
          <Skeleton className="h-5 w-32 rounded-md" />
        </div>
        <Skeleton className="h-5 w-8 rounded-full" />
      </div>
      <div className="h-px bg-muted/50 dark:bg-muted/30 mx-2 mb-3" />
      <div className="px-3 flex-1 overflow-hidden">
        <div className="space-y-3 mt-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );

  // Skeleton board with multiple columns
  const SkeletonBoard = () => (
    <div className="flex gap-4 pb-6 pt-2 px-2 w-fit overflow-x-auto overflow-y-hidden h-full">
      <SkeletonColumn />
      <SkeletonColumn />
      <SkeletonColumn />
      <SkeletonColumn />
    </div>
  );

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
              <Button variant={'ghost'} className=' text-muted-foreground '>
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
                  <Button variant={'ghost'} onClick={handleAddNewLead} className="whitespace-nowrap text-muted-foreground ">
                    <Plus className="h-4 w-4" />
                  </Button>
                }
              />
            </div>

            <div>
              <KanbanBoardManagerSheet
                isOpen={isKanbanManagerOpen}
                onOpenChange={setIsKanbanManagerOpen}
                boards={boards}
                onAddBoard={addBoard}
                onUpdateBoard={updateBoard}
                onRemoveBoard={removeBoard}
                trigger={
                  <Button 
                    variant={'ghost'} 
                    onClick={toggleKanbanManager} 
                    className="whitespace-nowrap text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Manage Boards
                  </Button>
                }
              />
            </div>
          </div>

          {leadsLoading && (
            <div className="flex-1 overflow-hidden">
              <SkeletonBoard />
            </div>
          )}

          {leadsError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-md p-4 mb-6">
              <div className="flex flex-col gap-4">
                <p className="text-destructive font-medium">{leadsError}</p>
                <p className="text-muted-foreground text-sm">
                  This could be due to a connection issue or missing Supabase configuration.
                  Please check your Supabase setup and make sure your environment variables are correctly set.
                </p>
              </div>
            </div>
          )}

          {!leadsLoading && !leadsError && (
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