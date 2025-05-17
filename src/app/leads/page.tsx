'use client';

import React, { useState, useEffect } from 'react'; // Removed useCallback
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Plus, 
  SquareStack, 
  ArrowUpDown, 
  Calendar, 
  Flag, 
  Funnel,
  X
} from 'lucide-react';
import KanbanBoard from '@/components/KanbanBoard';
import LeadsGrid from '@/components/LeadsGrid';
import LeadsList from '@/components/LeadsList';
import LeadSheet from '@/components/LeadSheet';
import KanbanBoardManagerSheet from '@/components/KanbanBoardManagerSheet';
import { LeadDeleteProvider } from '@/components/LeadDeleteProvider';
import { useLeads } from '@/hooks/useLeads';
import { Lead, KanbanColumn } from '@/types/leads';
import { Header } from '@/components/Header';
// import { Skeleton } from '@/components/ui/skeleton'; // Removed Skeleton import
import SkeletonLoader from '@/components/SkeletonLoader';
import { useKanbanBoards } from '@/hooks/useKanbanBoards';
import ViewToggle, { ViewType } from '@/components/ViewToggle';
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
  const [forceUpdate, ] = useState(0); // Removed setForceUpdate
  const [filterType, setFilterType] = useState<LeadFilterType>('none');
  // Add state for the current view
  const [currentView, setCurrentView] = useState<ViewType>('kanban');
  // Add state for list view sorting
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  // Track initial page load to only show loading indicator once
  const hasLoadedInitially = React.useRef(false);
  
  const {
    leads,
    loading: leadsLoading,
    error: leadsError,
    refreshLeads,
    updateLocalLead,
    removeLocalLead,
    setSearchTerm: handleSearch,
    // isInitialLoad: isLeadsInitialLoad // Removed isLeadsInitialLoad
  } = useLeads();
  
  // Get kanban boards data using the hook
  const {
    boards,
    loading: boardsLoading,
    // error: boardsError, // Removed boardsError
    addBoard,
    updateBoard,
    removeBoard,
    reorderBoards,
    fetchBoards
  } = useKanbanBoards(leads);
  
  // Only show loading spinner on the very first load of the page
  // This prevents flickering when switching views or refreshing data
  const showLoading = !hasLoadedInitially.current && (leadsLoading || boardsLoading) && leads.length === 0;
  
  // Mark as initially loaded once we have leads
  useEffect(() => {
    if (leads.length > 0 && !leadsLoading) {
      hasLoadedInitially.current = true;
    }
  }, [leads, leadsLoading]);
  
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
    // First close any open lead sheet to ensure form reset happens
    if (isLeadSheetOpen) {
      setIsLeadSheetOpen(false);
      // Use setTimeout to ensure state updates before reopening
      setTimeout(() => {
        setSelectedLead(undefined);
        setIsLeadSheetOpen(true);
      }, 10);
    } else {
      setSelectedLead(undefined);
      setIsLeadSheetOpen(true);
    }
  };
  
  const toggleKanbanManager = () => {
    setIsKanbanManagerOpen(!isKanbanManagerOpen);
  };
  
  // Enhanced handler for lead updates, including deletions
  const handleLeadUpdate = (updatedLead: Lead) => {
    // Check if this is a deletion (we added the __deleted flag in KanbanBoard)
    if ((updatedLead as Lead & { __deleted?: boolean }).__deleted) {
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

  // Handle reordering boards
  const handleReorderBoards = async (reorderedBoards: KanbanColumn[]) => {
    try {
      // Call the reorderBoards function from the hook - it now handles its own refreshing
      await reorderBoards(reorderedBoards);
    } catch (error) {
      console.error('Failed to reorder boards:', error);
    }
  };

  // Handle view toggle
  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
  };

  // Handle sort change for list view
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Apply filters and sorting to leads for card and list views
  const filteredAndSortedLeads = React.useMemo(() => {
    if (currentView === 'kanban') {
      return leads; // No need to filter here as KanbanBoard handles it
    }
    
    const filtered = [...leads]; // Changed let to const
    
    // Apply filters based on filterType
    switch (filterType) {
      case 'priority-high-first':
        filtered.sort((a, b) => {
          // Handle undefined priorities
          const priorityA = a.priority || 'low';
          const priorityB = b.priority || 'low';
          const priorityWeight = {
            'high': 3,
            'medium': 2,
            'low': 1
          };
          return priorityWeight[priorityB as keyof typeof priorityWeight] - 
                 priorityWeight[priorityA as keyof typeof priorityWeight];
        });
        break;
      case 'priority-low-first':
        filtered.sort((a, b) => {
          // Handle undefined priorities
          const priorityA = a.priority || 'low';
          const priorityB = b.priority || 'low';
          const priorityWeight = {
            'high': 3,
            'medium': 2,
            'low': 1
          };
          return priorityWeight[priorityA as keyof typeof priorityWeight] - 
                 priorityWeight[priorityB as keyof typeof priorityWeight];
        });
        break;
      case 'date-newest':
        filtered.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'date-oldest':
        filtered.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateA - dateB;
        });
        break;
      default:
        // Apply custom sort if we're in list view
        if (currentView === 'list' && sortColumn) {
          filtered.sort((a, b) => {
            let valA = a[sortColumn as keyof Lead] || '';
            let valB = b[sortColumn as keyof Lead] || '';
            
            // Special handling for dates
            if (sortColumn === 'created_at' || sortColumn === 'updated_at') {
              valA = valA ? new Date(valA as string).getTime() : 0;
              valB = valB ? new Date(valB as string).getTime() : 0;
            }
            
            // Special handling for priorities
            if (sortColumn === 'priority') {
              const priorityWeight = {
                'high': 3,
                'medium': 2,
                'low': 1,
                '': 0
              };
              valA = priorityWeight[((valA as string) || '') as keyof typeof priorityWeight] || 0;
              valB = priorityWeight[((valB as string) || '') as keyof typeof priorityWeight] || 0;
            }
            
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
          });
        }
        break;
    }
    
    return filtered;
  }, [leads, filterType, currentView, sortColumn, sortDirection]);

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

  // Removed individual skeleton components as they're now in the SkeletonLoader component

  // Effect to refresh boards when forceUpdate changes, but silently
  useEffect(() => {
    if (forceUpdate > 0) {
      fetchBoards({ silent: true });
    }
  }, [forceUpdate, fetchBoards]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleSearch(value);
  };

  // Clear search input
  const handleClearSearch = () => {
    setSearchTerm('');
    handleSearch('');
  };

  // Content wrapper with consistent width constraint
  const ViewContainer = ({ children }: { children: React.ReactNode }) => {
    return (
      <div className="w-full h-full flex-1 relative overflow-hidden">
        <ScrollArea className="absolute inset-0">
          {children}
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <LeadDeleteProvider onLeadDeleted={handleLeadUpdate}>
        <div className="container mx-auto p-4 flex-1 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h1 className="text-3xl font-normal">Leads</h1>
          </div>

          <div className="w-full flex-1 flex flex-col">
            <div className="flex items-center mb-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-8 w-full sm:w-64 border-none bg-muted pr-8"
                />
                {searchTerm && (
                  <button 
                    onClick={handleClearSearch}
                    className="absolute right-2 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Use the ViewToggle component */}
              <div className="flex items-center gap-1 px-3 py-2 rounded-md">
                <ViewToggle 
                  currentView={currentView} 
                  onViewChange={handleViewChange} 
                />
              </div>

              <div className="flex w-full sm:w-auto gap-2 mr-2">
                <LeadSheet
                  isOpen={isLeadSheetOpen}
                  onOpenChange={setIsLeadSheetOpen}
                  lead={selectedLead}
                  onSuccess={() => { // Removed unused 'lead' variable
                    // Refresh without loading spinners
                    refreshLeads({ silent: true });
                  }}
                  onError={(error: Error) => { // Specified Error type
                    console.error('Error with lead operation:', error);
                  }}
                  trigger={
                    <Button variant={'secondary'} onClick={handleAddNewLead} className="whitespace-nowrap text-muted-foreground">
                      <Plus className="h-4 w-4" />
                    </Button>
                  }
                />
              </div>

              {/* Only show kanban manager button in kanban view */}
              {currentView === 'kanban' && (
                <div className='mr-2'>
                  <KanbanBoardManagerSheet
                    isOpen={isKanbanManagerOpen}
                    onOpenChange={setIsKanbanManagerOpen}
                    boards={boards}
                    onAddBoard={handleAddBoard}
                    onUpdateBoard={handleUpdateBoard}
                    onRemoveBoard={handleRemoveBoard}
                    onReorderBoards={handleReorderBoards}
                    trigger={
                      <Button 
                      variant={'secondary'} 
                        onClick={toggleKanbanManager} 
                        className="whitespace-nowrap text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <SquareStack className="h-4 w-4" />
                      </Button>
                    }
                  />
                </div>
              )}

              {/* Filter Dropdown */}
              <div className="flex items-center mr-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="h-9 gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Funnel className="h-4 w-4" />
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

            {/* Display loading state only on initial page load, never when switching views */}
            {showLoading ? (
              <ViewContainer>
                <SkeletonLoader variant={currentView} />
              </ViewContainer>
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
                  <ViewContainer>
                    {currentView === 'kanban' && (
                      <KanbanBoard 
                        leads={leads}
                        onLeadUpdate={handleLeadUpdate}
                        onEditLead={handleEditLead}
                        onContactLead={handleContactLead}
                        filterType={filterType}
                        className="h-full"
                      />
                    )}
                    
                    {currentView === 'card' && (
                      <div className="p-4 h-full">
                        <LeadsGrid 
                          leads={filteredAndSortedLeads}
                          onEditLead={handleEditLead}
                          onContactLead={handleContactLead}
                        />
                      </div>
                    )}
                    
                    {currentView === 'list' && (
                      <div className="p-4 h-full">
                        <LeadsList 
                          leads={filteredAndSortedLeads}
                          boards={boards} // Pass the boards data to the list view
                          onEditLead={handleEditLead}
                          onContactLead={handleContactLead}
                          onSort={handleSort}
                          sortColumn={sortColumn}
                          sortDirection={sortDirection}
                        />
                      </div>
                    )}
                  </ViewContainer>
                )}
              </>
            )}
          </div>
        </div>
      </LeadDeleteProvider>
    </div>
  );
}
