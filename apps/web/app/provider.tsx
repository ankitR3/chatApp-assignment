'use client'

import { SessionProvider } from 'next-auth/react';
import AxiosInterceptor from '@/src/components/auth/AxiosInterceptor';

export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <AxiosInterceptor>
        {children}
      </AxiosInterceptor>
    </SessionProvider>
  );
}