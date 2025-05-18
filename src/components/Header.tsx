'use client';

import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur supports-[backdrop-filter]:bg-black/10">
      <div className="container-fluid flex h-14 items-center px-10">
        <div className="ml-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">mini CRM</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}