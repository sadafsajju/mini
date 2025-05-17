import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lead } from '@/types/leads';
import { KanbanCardHistory, getCardHistory } from '@/lib/api/kanbanCardHistory';
import { formatDistanceToNow } from 'date-fns';
import { History } from 'lucide-react';

interface KanbanCardHistoryDialogProps {
  lead: Lead;
}

export default function KanbanCardHistoryDialog({ lead }: KanbanCardHistoryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<KanbanCardHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!isOpen) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const historyData = await getCardHistory(lead.id);
      setHistory(historyData);
    } catch (err) {
      console.error('Error fetching card history:', err);
      setError('Failed to load card history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [isOpen, lead.id]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 w-7 p-0 absolute right-10 top-2 opacity-0 bg-gray-800/10 hover:bg-gray-800/30 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
        >
          <History className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Card Movement History</DialogTitle>
          <DialogDescription>
            View history of all movements for &quot;{lead.name}&quot;
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive/30 rounded-md p-4">
              <p className="text-destructive font-medium">{error}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center text-muted-foreground py-6">
              No movement history found for this card.
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div 
                  key={entry.id} 
                  className="border rounded-md p-3 bg-muted/20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">
                      {entry.from_column} → {entry.to_column}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  {entry.notes && (
                    <div className="text-sm mt-1 border-t border-border/50 dark:border-muted/20 pt-2">
                      {entry.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
