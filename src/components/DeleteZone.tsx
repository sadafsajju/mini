import React from 'react';
import { Trash2 } from 'lucide-react';

interface DeleteZoneProps {
  visible: boolean;
  isOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export default function DeleteZone({ 
  visible, 
  isOver, 
  onDragOver, 
  onDragLeave, 
  onDrop 
}: DeleteZoneProps) {
  if (!visible) return null;
  
  return (
<div 
  className={`fixed bottom-0 left-0 right-0 h-20 mx-auto w-full flex items-center justify-center 
              bg-gradient-to-b from-red-500/0 to-red-900/90 z-50 transition-all duration-200 
              ${isOver ? 'scale-110 shadow-lg' : ''}`}
  onDragOver={onDragOver}
  onDragLeave={onDragLeave}
  onDrop={onDrop}
>
      <Trash2 className={`h-8 w-8 text-white ${isOver ? 'animate-bounce' : ''}`} />
      <span className="ml-2 text-white font-medium">Drop to Delete</span>
    </div>
  );
}