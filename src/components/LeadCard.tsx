import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Phone, Mail, MapPin, FileText, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Lead } from '@/types/leads';

interface LeadCardProps {
  lead: Lead;
  onEdit?: (id: number) => void;
  onContact?: (id: number) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ 
  lead, 
  onEdit, 
  onContact 
}) => {
  // Get time ago string
  const timeAgo = lead.created_at 
    ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })
    : '';

  // Priority badge configuration
  const priorityConfig = {
    high: { 
      class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      icon: <Flag className="h-3 w-3 mr-1" /> 
    },
    medium: { 
      class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      icon: <Flag className="h-3 w-3 mr-1" /> 
    },
    low: { 
      class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      icon: <Flag className="h-3 w-3 mr-1" /> 
    }
  };
  
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{lead.name}</CardTitle>
          {lead.priority && (
            <Badge variant="outline" className={`flex items-center ${priorityConfig[lead.priority as keyof typeof priorityConfig].class}`}>
              {priorityConfig[lead.priority as keyof typeof priorityConfig].icon}
              <span className="capitalize">{lead.priority}</span>
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 py-2">
        <div className="flex items-start">
          <Mail className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-muted-foreground" />
          <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
            {lead.email}
          </a>
        </div>
        {lead.phone_number && (
          <div className="flex items-start">
            <Phone className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-muted-foreground" />
            <span>{lead.phone_number}</span>
          </div>
        )}
        {lead.address && (
          <div className="flex items-start">
            <MapPin className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">{lead.address}</span>
          </div>
        )}
        {lead.notes && (
          <div className="flex items-start">
            <FileText className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-muted-foreground" />
            <p className="text-muted-foreground">{lead.notes}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <span className="text-xs text-muted-foreground">{timeAgo}</span>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEdit && onEdit(lead.id)}
          >
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button 
            size="sm" 
            onClick={() => onContact && onContact(lead.id)}
          >
            <Phone className="h-4 w-4 mr-1" /> Contact
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default LeadCard;