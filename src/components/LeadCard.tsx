import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MapPin, FileText } from 'lucide-react';
import { Lead } from '@/types/supabase';

interface LeadCardProps {
  lead: Lead;
  onEdit?: (id: number) => void;
  onContact?: (id: number) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({ 
  lead, 
  onEdit, 
  onContact 
}) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{lead.name}</CardTitle>
        <CardDescription className="flex items-center mt-1">
          <Mail className="h-4 w-4 mr-2" />
          <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
            {lead.email}
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start">
          <Phone className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
          <span>{lead.phone_number}</span>
        </div>
        <div className="flex items-start">
          <MapPin className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
          <span>{lead.address}</span>
        </div>
        <div className="flex items-start">
          <FileText className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
          <p className="text-gray-700">{lead.notes}</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onEdit && onEdit(lead.id)}
        >
          Edit
        </Button>
        <Button 
          size="sm" 
          onClick={() => onContact && onContact(lead.id)}
        >
          Contact
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LeadCard;