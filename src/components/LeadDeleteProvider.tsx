'use client';
import React, { createContext, useState, useContext } from 'react';
import { Lead } from '@/types/leads';
import LeadDeleteAlert from './LeadDeleteAlert';
import { deleteLead } from '@/lib/api/leads';

interface LeadDeleteContextType {
  openDeleteDialog: (lead: Lead) => void;
}

const LeadDeleteContext = createContext<LeadDeleteContextType | undefined>(undefined);

export const useLeadDelete = () => {
  const context = useContext(LeadDeleteContext);
  if (!context) {
    throw new Error('useLeadDelete must be used within a LeadDeleteProvider');
  }
  return context;
};

interface LeadDeleteProviderProps {
  children: React.ReactNode;
  onLeadDeleted?: (lead: Lead) => void;
}

export const LeadDeleteProvider: React.FC<LeadDeleteProviderProps> = ({ 
  children,
  onLeadDeleted
}) => {
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDeleteDialog = (lead: Lead) => {
    setLeadToDelete(lead);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // Delete the lead from the database
      await deleteLead(leadToDelete.id);
      
      // Notify parent component about the deletion
      if (onLeadDeleted) {
        onLeadDeleted({
          ...leadToDelete,
          __deleted: true
        } as Lead & { __deleted: boolean });
      }
      
      // Close the alert dialog
      setIsDeleteAlertOpen(false);
    } catch (error) {
      console.error('Error deleting lead:', error);
    } finally {
      setIsDeleting(false);
      setLeadToDelete(null);
    }
  };

  return (
    <LeadDeleteContext.Provider value={{ openDeleteDialog }}>
      {children}
      
      <LeadDeleteAlert
        isOpen={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
        lead={leadToDelete}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </LeadDeleteContext.Provider>
  );
};
