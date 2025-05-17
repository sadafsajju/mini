import React, { useState, useEffect } from 'react';
import { KanbanCardHistory as KanbanCardHistoryType, getCardHistory } from '@/lib/api/kanbanCardHistory';
import { formatDistanceToNow, format } from 'date-fns';
import { Lead } from '@/types/leads';
import { getLeadById } from '@/lib/api/leads';

interface KanbanCardHistoryProps {
  leadId: number;
}

export default function KanbanCardHistory({ leadId }: KanbanCardHistoryProps) {
  const [history, setHistory] = useState<KanbanCardHistoryType[]>([]);
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Sort history newest to oldest (reverse chronological)
        const [leadData, historyData] = await Promise.all([
          getLeadById(leadId),
          getCardHistory(leadId)
        ]);
        
        // Sort history in reverse chronological order (newest first)
        const sortedHistory = historyData.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        setLead(leadData);
        setHistory(sortedHistory);
      } catch (err) {
        console.error('Error fetching card history:', err);
        setError('Failed to load card history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [leadId]);

  return (
    <div className="space-y-4 py-4 max-h-[calc(100vh-180px)] overflow-y-auto">
      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/30 rounded-md p-4">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      ) : (
        <div className="relative pl-6 pt-1 pb-2">
          {/* Container for timeline entries with relative positioning */}
          <div className="relative">
            {/* Timeline line - starts at bottom dot and goes up */}
            <div className="absolute left-[-20px] w-[2px] bg-border" 
                 style={{ 
                  top: '20px',
                   left: '-15px', 
                   height: `calc(100% - 135px)` 
                 }}></div>
            
            {/* Show message if no history */}
            {history.length === 0 && (
              <div className="mb-8 text-center text-muted-foreground">
                No movement history yet - this lead hasn't been moved between columns.
              </div>
            )}
            
            {/* Movement history entries - newest to oldest (top to bottom) */}
            {history.map((entry, index) => (
              <div 
                key={entry.id} 
                className="mb-6 relative"
              >
                {/* Timeline dot with color - highlight current status (first entry) */}
                <div className={`absolute left-[-22px] top-1 h-4 w-4 rounded-full border-2 ${index === 0 
                  ? 'border-primary bg-primary/20' 
                  : 'border-border bg-background'
                }`}></div>
                
                {/* Card content */}
                <div className="border border-border/60 rounded-md overflow-hidden shadow-sm">
                  {/* Header with column movement */}
                  <div className="flex items-center justify-between p-3 bg-muted/30 border-b border-border/50">
                    <div className="font-medium flex items-center gap-2">
                      <span className="text-muted-foreground">{entry.from_column_title || entry.from_column}</span>
                      <span className="text-sm">→</span>
                      <span>{entry.to_column_title || entry.to_column}</span>
                      {index === 0 && (
                        <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Current</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Notes section (if any) */}
                  {entry.notes && (
                    <div className="p-3 text-sm">
                      {entry.notes}
                    </div>
                  )}
                  
                  {/* Timestamp */}
                  <div className="text-xs text-muted-foreground p-2 pt-0 flex justify-between items-center">
                    <div>
                      {format(new Date(entry.created_at), 'PPp')}
                    </div>
                    <div>
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Initial lead creation - always at the bottom as the starting point */}
            {lead && (
              <div className="mb-0 relative">
                {/* Timeline dot for creation */}
                <div className="absolute left-[-22px] top-1 h-4 w-4 rounded-full border-2 border-blue-500 bg-blue-100 dark:bg-blue-900/30"></div>
                
                {/* Card content */}
                <div className="border border-border/60 rounded-md overflow-hidden shadow-sm">
                  {/* Header with creation info */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-border/50">
                    <div className="font-medium flex items-center gap-2">
                      <span>Lead Created</span>
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">Start</span>
                    </div>
                  </div>
                  
                  {/* Notes section (if exists) */}
                  {lead.notes && (
                    <div className="p-3 text-sm">
                      {lead.notes}
                    </div>
                  )}
                  
                  {/* Display message when no notes */}
                  {!lead.notes && (
                    <div className="p-3 text-sm text-muted-foreground italic">
                      No initial notes were added when this lead was created.
                    </div>
                  )}
                  
                  {/* Timestamp */}
                  <div className="text-xs text-muted-foreground p-2 pt-0 flex justify-between items-center">
                    <div>
                      {lead.created_at ? format(new Date(lead.created_at), 'PPp') : 'N/A'}
                    </div>
                    <div>
                      {lead.created_at ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true }) : ''}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}