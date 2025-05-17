'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

// Define props for our ThemeProvider component
type ThemeProviderProps = {
  children: React.ReactNode;
  // Add any additional props you want to expose
};

// Create a wrapper component that doesn't rely on the missing types
export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}