'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './auth/AuthProvider';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AuthProvider>
          {children}
          <Toaster 
            position="bottom-center" 
            toastOptions={{
              style: {
                background: 'var(--bg-elevated)',
                color: 'var(--ink)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
              },
              success: {
                iconTheme: {
                  primary: 'var(--teal)',
                  secondary: 'var(--bg-elevated)',
                },
              },
              error: {
                iconTheme: {
                  primary: 'var(--chili)',
                  secondary: 'var(--bg-elevated)',
                },
              },
            }} 
          />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
