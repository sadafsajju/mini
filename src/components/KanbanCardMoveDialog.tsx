import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Lead } from '@/types/leads';

interface KanbanCardMoveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  fromColumn: string;
  toColumn: string;
  onSave: (notes: string) => void;
}

export default function KanbanCardMoveDialog({
  isOpen,
  onClose,
  lead,
  fromColumn,
  toColumn,
  onSave,
}: KanbanCardMoveDialogProps) {
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      await onSave(notes);
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Card Movement Notes</DialogTitle>
          <DialogDescription>
            Add notes about why you're moving this card from "{fromColumn}" to "{toColumn}".
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium">
              Card: {lead?.name}
            </div>
            <Textarea
              placeholder="Add notes about this movement (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                Saving...
              </span>
            ) : (
              'Save Notes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
