import React from 'react';

export function Main({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {children}
    </main>
  );
}

export function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
      {children}
    </div>
  );
}

export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-4xl font-bold mb-8 text-center">{children}</h1>
  );
}

export function FormSection({ children, onSubmit }: { children: React.ReactNode, onSubmit: React.FormEventHandler }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {children}
    </form>
  );
}
