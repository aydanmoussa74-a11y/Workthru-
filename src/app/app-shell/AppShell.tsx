import React from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div id="workout-app-shell" className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100">
      <Header />
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-4 pb-24 sm:px-6 sm:pt-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};
