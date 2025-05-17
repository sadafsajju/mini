'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Sheet, 
  SheetTrigger, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription, 
  SheetFooter, 
  SheetClose 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Lead } from '@/types/leads';
import { createLead, updateLead } from '@/lib/api/leads';
import { toast } from '@/components/ui/use-toast';

// Create schema for form validation
const leadFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone_number: z.string().default(''),
  address: z.string().default(''),
  notes: z.string().default(''),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'closed']).default('new'),
  priority: z.enum(['low', 'medium', 'high']).optional()
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface LeadSheetProps {
  lead?: Lead;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (lead: Lead) => void;
  onError?: (error: Error) => void;
  trigger?: React.ReactNode;
}

export default function LeadSheet({ 
  lead, 
  isOpen, 
  onOpenChange, 
  onSuccess,
  onError,
  trigger
}: LeadSheetProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEditing = !!lead?.id;

  // Initialize form with default values or existing lead data
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema) as any,
    defaultValues: {
      name: lead?.name || '',
      email: lead?.email || '',
      phone_number: lead?.phone_number || '',
      address: lead?.address || '',
      notes: lead?.notes || '',
      status: (lead?.status as "new" | "contacted" | "qualified" | "proposal" | "closed") || 'new',
      priority: lead?.priority || undefined
    }
  });

  // Update form values when lead prop changes
  useEffect(() => {
    if (lead) {
      // Only set form values when editing an existing lead
      form.reset({
        name: lead.name,
        email: lead.email,
        phone_number: lead.phone_number || '',
        address: lead.address || '',
        notes: lead.notes || '',
        status: lead.status as "new" | "contacted" | "qualified" | "proposal" | "closed" || 'new',
        priority: lead.priority
      });
    } else {
      // Reset to empty values when creating a new lead
      form.reset({
        name: '',
        email: '',
        phone_number: '',
        address: '',
        notes: '',
        status: 'new',
        priority: undefined
      });
    }
  }, [lead, form]);

  // Sync internal open state with parent component
  useEffect(() => {
    if (isOpen !== undefined) {
      setOpen(isOpen);
    }
  }, [isOpen]);

  // Handle internal state change and propagate to parent if needed
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
    
    // Reset form when closing the sheet
    if (!newOpen) {
      // Clear the form completely with empty values
      form.reset({
        name: '',
        email: '',
        phone_number: '',
        address: '',
        notes: '',
        status: 'new',
        priority: undefined
      });
    }
  };

  // Handle form submission
  const onSubmit = async (data: LeadFormValues) => {
    setLoading(true);
    try {
      let result: Lead;

      // Ensure values are properly formatted
      const formattedData = {
        name: data.name.trim(),
        email: data.email.trim(),
        phone_number: data.phone_number ? data.phone_number.trim() : '',
        address: data.address ? data.address.trim() : '',
        notes: data.notes ? data.notes.trim() : '',
        status: data.status as "new" | "contacted" | "qualified" | "proposal" | "closed",
        priority: data.priority
      };

      if (isEditing && lead?.id) {
        // Update existing lead
        result = await updateLead(lead.id, formattedData);
        toast({
          title: "Lead updated",
          description: "Lead has been successfully updated."
        });
      } else {
        // Create new lead
        result = await createLead(formattedData);
        toast({
          title: "Lead created",
          description: "New lead has been successfully created."
        });
      }

      // Call success callback with updated/created lead
      if (onSuccess) {
        onSuccess(result);
      }

      // Close the sheet
      handleOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error saving lead:", error);
      
      // Create an error object
      const errorMessage = error instanceof Error ? error.message : "Failed to save lead. Please try again.";
      const errorObj = error instanceof Error ? error : new Error(errorMessage);
      
      // Show toast
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Call error callback if provided
      if (onError) {
        onError(errorObj);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      
      <SheetContent className="sm:max-w-md flex flex-col p-0 h-full">
        <SheetHeader className="sticky top-0 z-10 border-b px-6 py-4 bg-background">
          <SheetTitle>{isEditing ? 'Edit Lead' : 'Add New Lead'}</SheetTitle>
          <SheetDescription>
            {isEditing 
              ? 'Update lead information in the form below.' 
              : 'Fill in the details to create a new lead.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Form {...form}>
            <form id="lead-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john.doe@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, City, Country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="proposal">Proposal</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes about the lead..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <SheetFooter className="sticky bottom-0 border-t px-6 py-4 mt-auto bg-background">
          <SheetClose asChild>
            <Button variant="outline" type="button">Cancel</Button>
          </SheetClose>
          <Button type="submit" form="lead-form" disabled={loading}>
            {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}