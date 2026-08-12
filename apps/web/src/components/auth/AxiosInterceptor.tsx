'use client'

import axios from 'axios';
import { signOut } from 'next-auth/react';

// Auto sign-out on 401 responses (expired/invalid session token)
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Session is invalid/expired — sign out and redirect to login
            await signOut({ callbackUrl: '/' });
        }
        return Promise.reject(error);
    }
);

export default function AxiosInterceptor({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
