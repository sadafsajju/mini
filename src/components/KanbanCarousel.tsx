import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { KanbanColumn as KanbanColumnType, Lead } from '@/types/leads';
import KanbanColumn from './KanbanColumn';

interface KanbanCarouselProps {
  columns: KanbanColumnType[];
  onEditLead?: (id: number) => void;
  onContactLead?: (id: number) => void;
  onLeadUpdate?: (updatedLead: Lead) => void;
  onDragStart?: (e: React.DragEvent, lead: Lead, sourceColumn: KanbanColumnType) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetColumn: KanbanColumnType) => void;
  onMobileMoveCard?: (lead: Lead, sourceColumn: KanbanColumnType, targetColumn: KanbanColumnType) => void;
}

export default function KanbanCarousel({
  columns,
  onEditLead,
  onContactLead,
  onLeadUpdate,
  onDragStart,
  onDragOver,
  onDrop,
  onMobileMoveCard
}: KanbanCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Check if this is a mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < columns.length - 1 ? prev + 1 : prev));
  };

  // Touch event handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      // Swipe left
      handleNext();
    }
    
    if (touchStart - touchEnd < -50) {
      // Swipe right
      handlePrevious();
    }
  };

  // Indicator dots for navigation
  const renderDots = () => {
    return (
      <div className="flex justify-center mt-4 space-x-2">
        {columns.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              currentIndex === index ? 'bg-primary' : 'bg-muted'
            }`}
            aria-label={`Go to column ${index + 1}`}
          />
        ))}
      </div>
    );
  };

  // Only show the current column in the carousel on mobile
  const visibleColumns = isMobile
    ? [columns[currentIndex]]
    : columns;

  // Display the column title as a header in mobile view
  const currentColumnTitle = isMobile && columns[currentIndex]
    ? columns[currentIndex].title
    : null;

  return (
    <div className="w-full flex flex-col">
      {isMobile && currentColumnTitle && (
        <div className="text-center mb-2 flex items-center justify-center">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`p-1 rounded-full ${
              currentIndex === 0 ? 'text-muted-foreground' : 'text-primary'
            }`}
            aria-label="Previous column"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="font-medium mx-2">{currentColumnTitle}</h2>
          <button
            onClick={handleNext}
            disabled={currentIndex === columns.length - 1}
            className={`p-1 rounded-full ${
              currentIndex === columns.length - 1 ? 'text-muted-foreground' : 'text-primary'
            }`}
            aria-label="Next column"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
      
      <div
        ref={carouselRef}
        className={`relative overflow-hidden ${isMobile ? 'w-full' : 'flex gap-4 pb-6 pt-2 px-2 w-fit overflow-x-auto'}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className={`flex transition-transform duration-300 ease-in-out ${
            isMobile ? 'justify-center w-full' : 'gap-4'
          }`}
          style={
            isMobile 
              ? { transform: `translateX(0)` } 
              : undefined
          }
        >
          {visibleColumns.map(column => (
            <KanbanColumn
              key={`${column.id}-carousel`}
              column={column}
              onEditLead={onEditLead}
              onContactLead={onContactLead}
              onLeadUpdate={onLeadUpdate}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              allColumns={columns}
              onMoveCard={(lead, sourceColumn, targetColumn) => {
                if (onMobileMoveCard) {
                  onMobileMoveCard(lead, sourceColumn, targetColumn);
                }
              }}
            />
          ))}
        </div>
      </div>
      
      {isMobile && renderDots()}
    </div>
  );
}