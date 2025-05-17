'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Types for skeleton variants
export type SkeletonVariant = 'kanban' | 'card' | 'list';

interface SkeletonLoaderProps {
  variant: SkeletonVariant;
  className?: string;
  count?: number; // Number of skeleton items to render (for card and list variants)
}

// Individual skeleton components
const SkeletonCard = () => (
  <div className="mb-3 shadow-none border bg-card/30 dark:bg-card/20 dark:border-muted/20 rounded-xl p-3">
    <div className="flex flex-col space-y-2">
      <Skeleton className="h-5 w-3/4 rounded-md" />
      <Skeleton className="h-4 w-full rounded-md" />
      <div className="flex items-center gap-2 mt-1">
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3 w-1/2 rounded-md" />
      </div>
    </div>
  </div>
);

const SkeletonColumn = () => (
  <div className="bg-muted/60 dark:bg-muted/20 rounded-2xl min-w-64 w-72 flex-shrink-0 h-[calc(100vh-11rem)] flex flex-col">
    <div className="flex items-center justify-between mb-3 px-4 pt-3">
      <div className="flex items-center">
        <Skeleton className="w-2 h-2 rounded-full mr-2" />
        <Skeleton className="h-5 w-32 rounded-md" />
      </div>
      <Skeleton className="h-5 w-8 rounded-full" />
    </div>
    <div className="h-px bg-muted/50 dark:bg-muted/30 mx-2 mb-3" />
    <div className="px-3 flex-1 overflow-hidden">
      <div className="space-y-3 mt-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  </div>
);

const SkeletonBoard = () => (
  <div className="flex gap-4 pb-6 pt-2 px-2 w-full min-w-full overflow-x-auto overflow-y-hidden h-full">
    <SkeletonColumn />
    <SkeletonColumn />
    <SkeletonColumn />
    <SkeletonColumn />
  </div>
);

const SkeletonGridItem = () => (
  <div className="bg-card dark:bg-card/80 shadow-none border dark:border-muted/20 rounded-xl p-4">
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex justify-end gap-2 pt-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  </div>
);

const SkeletonGrid = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonGridItem key={i} />
    ))}
  </div>
);

const SkeletonListHeader = () => (
  <div className="flex p-4 border-b">
    <Skeleton className="h-6 w-32 mr-6" />
    <Skeleton className="h-6 w-48 mr-6" />
    <Skeleton className="h-6 w-32 mr-6" />
    <Skeleton className="h-6 w-24 mr-6" />
    <Skeleton className="h-6 w-20 mr-6" />
    <Skeleton className="h-6 w-20 mr-6" />
    <div className="flex-1 flex justify-end">
      <Skeleton className="h-6 w-36" />
    </div>
  </div>
);

const SkeletonListRow = () => (
  <div className="flex items-center p-4 border-b">
    <Skeleton className="h-5 w-32 mr-6" />
    <Skeleton className="h-5 w-48 mr-6" />
    <Skeleton className="h-5 w-32 mr-6" />
    <Skeleton className="h-5 w-24 mr-6" />
    <Skeleton className="h-5 w-20 mr-6" />
    <Skeleton className="h-5 w-20 mr-6" />
    <div className="flex-1 flex justify-end gap-2">
      <Skeleton className="h-9 w-16" />
      <Skeleton className="h-9 w-20" />
    </div>
  </div>
);

const SkeletonList = ({ count = 8 }: { count?: number }) => (
  <div className="w-full">
    <SkeletonListHeader />
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonListRow key={i} />
    ))}
  </div>
);

// Main component
const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ variant, className = '', count = 6 }) => {
  const getSkeletonContent = () => {
    switch (variant) {
      case 'kanban':
        return <SkeletonBoard />;
      case 'card':
        return <SkeletonGrid count={count} />;
      case 'list':
        return <SkeletonList count={count} />;
      default:
        return <SkeletonBoard />;
    }
  };

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      {getSkeletonContent()}
    </div>
  );
};

export default SkeletonLoader;
