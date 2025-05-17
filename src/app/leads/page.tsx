'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Plus, 
  Kanban, 
  SquareStack, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Calendar, 
  Flag 
} from 'lucide-react';
import KanbanBoard from '@/components/KanbanBoard';
import LeadSheet from '@/components/LeadSheet';
import KanbanBoardManagerSheet from '@/components/KanbanBoardManagerSheet';
import { useLeads } from '@/hooks/useLeads';
import { Lead, KanbanColumn } from '@/types/leads';
import { Header } from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { useKanbanBoards } from '@/hooks/useKanbanBoards';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define filter types
export type LeadFilterType = 'none' | 'priority-high-first' | 'priority-low-first' | 'date-newest' | 'date-oldest';

export default function LeadsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLeadSheetOpen, setIsLeadSheetOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | undefined>(undefined);
  const [isKanbanManagerOpen, setIsKanbanManagerOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [filterType, setFilterType] = useState<LeadFilterType>('none');
  
  const {
    leads,
    loading: leadsLoading,
    error: leadsError,
    refreshLeads,
    updateLocalLead,
    removeLocalLead
  } = useLeads();
  
  // Get kanban boards data using the hook
  const {
    boards,
    loading: boardsLoading,
    error: boardsError,
    addBoard,
    updateBoard,
    removeBoard,
    fetchBoards
  } = useKanbanBoards(leads);
  
  // Only show loading spinner on initial load, not during actions
  const showLoading = leadsLoading && boards.length === 0;
  
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
  
  const toggleKanbanManager = () => {
    setIsKanbanManagerOpen(!isKanbanManagerOpen);
  };
  
  // Enhanced handler for lead updates, including deletions
  const handleLeadUpdate = (updatedLead: Lead) => {
    // Check if this is a deletion (we added the __deleted flag in KanbanBoard)
    if ((updatedLead as any).__deleted) {
      // If the lead was deleted, remove it from local state
      if (removeLocalLead) {
        removeLocalLead(updatedLead.id);
      } else {
        // Fallback if removeLocalLead isn't available - use silent refresh
        refreshLeads({ silent: true });
      }
    } else {
      // Normal update
      updateLocalLead(updatedLead);
    }
    
    // Force refresh of the board without loading state
    setTimeout(() => {
      fetchBoards({ silent: true });
    }, 100);
  };

  // Enhanced callbacks with proper state updates
  const handleAddBoard = async (board: Omit<KanbanColumn, 'leads' | 'id'>) => {
    const result = await addBoard(board);
    // Force a silent refresh 
    setTimeout(() => {
      fetchBoards({ silent: true });
    }, 100);
    return result;
  };

  const handleUpdateBoard = async (id: string, board: Partial<Omit<KanbanColumn, 'leads' | 'id'>>) => {
    const result = await updateBoard(id, board);
    // Force a silent refresh
    setTimeout(() => {
      fetchBoards({ silent: true });
    }, 100);
    return result;
  };

  const handleRemoveBoard = async (id: string) => {
    await removeBoard(id);
    // Force a silent refresh
    setTimeout(() => {
      fetchBoards({ silent: true });
    }, 100);
  };

  // Get the filter label for display
  const getFilterLabel = () => {
    switch (filterType) {
      case 'priority-high-first':
        return 'Priority (High → Low)';
      case 'priority-low-first':
        return 'Priority (Low → High)';
      case 'date-newest':
        return 'Date (Newest first)';
      case 'date-oldest':
        return 'Date (Oldest first)';
      default:
        return 'Filter';
    }
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

  // Effect to refresh boards when forceUpdate changes, but silently
  useEffect(() => {
    if (forceUpdate > 0) {
      fetchBoards({ silent: true });
    }
  }, [forceUpdate, fetchBoards]);

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
              <Button variant={'ghost'} className='text-muted-foreground'>
                <Kanban className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex w-full sm:w-auto gap-2">
              <LeadSheet
                isOpen={isLeadSheetOpen}
                onOpenChange={setIsLeadSheetOpen}
                lead={selectedLead}
                onSuccess={(lead) => {
                  // Refresh without loading spinners
                  refreshLeads({ silent: true });
                }}
                onError={(error) => {
                  console.error('Error with lead operation:', error);
                }}
                trigger={
                  <Button variant={'ghost'} onClick={handleAddNewLead} className="whitespace-nowrap text-muted-foreground">
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
                onAddBoard={handleAddBoard}
                onUpdateBoard={handleUpdateBoard}
                onRemoveBoard={handleRemoveBoard}
                trigger={
                  <Button 
                    variant={'ghost'} 
                    onClick={toggleKanbanManager} 
                    className="whitespace-nowrap text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <SquareStack className="h-4 w-4" />
                  </Button>
                }
              />
            </div>

                        {/* Filter Dropdown */}
                        <div className="flex items-center mr-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline text-sm">{getFilterLabel()}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filter Leads</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem 
                      onClick={() => setFilterType('none')}
                      className={filterType === 'none' ? 'bg-accent' : ''}
                    >
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                      <span>None</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">By Priority</DropdownMenuLabel>
                    <DropdownMenuItem 
                      onClick={() => setFilterType('priority-high-first')}
                      className={filterType === 'priority-high-first' ? 'bg-accent' : ''}
                    >
                      <Flag className="mr-2 h-4 w-4" />
                      <span>High to Low</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setFilterType('priority-low-first')}
                      className={filterType === 'priority-low-first' ? 'bg-accent' : ''}
                    >
                      <Flag className="mr-2 h-4 w-4" />
                      <span>Low to High</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">By Date</DropdownMenuLabel>
                    <DropdownMenuItem 
                      onClick={() => setFilterType('date-newest')}
                      className={filterType === 'date-newest' ? 'bg-accent' : ''}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Newest First</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setFilterType('date-oldest')}
                      className={filterType === 'date-oldest' ? 'bg-accent' : ''}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Oldest First</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
          </div>

          {showLoading ? (
            <div className="flex-1 overflow-hidden">
              <SkeletonBoard />
            </div>
          ) : leadsError ? (
            <div className="bg-destructive/10 border border-destructive/30 rounded-md p-4 mb-6">
              <div className="flex flex-col gap-4">
                <p className="text-destructive font-medium">{leadsError}</p>
                <p className="text-muted-foreground text-sm">
                  This could be due to a connection issue or missing Supabase configuration.
                  Please check your Supabase setup and make sure your environment variables are correctly set.
                </p>
              </div>
            </div>
          ) : (
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
                      filterType={filterType}
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