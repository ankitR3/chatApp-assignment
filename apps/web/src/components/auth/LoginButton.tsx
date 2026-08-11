'use client'

import React, { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { disconnectSocket } from '@/src/hooks/useSocket';
import AuthModal from './AuthModal';

interface LogInButtonProps {
    size?: 'sm' | 'lg';
    className?: string;
}

export default function LogInButton({ size = 'sm', className = '' }: LogInButtonProps) {
    const { data: session, status } = useSession();
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        disconnectSocket();
        await signOut({ redirect: false });
        router.replace('/');
    }

    if (status === 'loading') {
        return (
            <div className={`h-8 rounded-md bg-gray-100 animate-pulse ${size === 'lg' ? 'w-24' : 'w-16'}`} />
        );
    }

    if (session?.user) {
        return (
            <div className='flex items-center gap-3'>
                <div className='flex items-center gap-2'>
                    {session.user.image && (
                        <img
                            src={session.user.image}
                            alt={session.user.name || 'User'}
                            className='w-7 h-7 rounded-full border border-gray-200'
                        />
                    )}
                    <span className='text-xs font-medium text-gray-700'>{session.user.name}</span>
                </div>
                <Button
                    variant='ghost'
                    size='sm'
                    onClick={handleLogout}
                    className='text-xs text-gray-500 hover:text-gray-900'
                >
                    Sign Out
                </Button>
            </div>
        )
    }

    const buttonStyle = size === 'lg' 
        ? 'bg-gray-900 hover:bg-gray-800 text-white text-sm px-6 py-2.5 rounded-md font-medium transition-all shadow-sm cursor-pointer'
        : 'bg-gray-900 hover:bg-gray-800 text-white text-xs px-4 py-2 rounded-md transition-all shadow-xs cursor-pointer';

    return (
        <>
            <Button
                onClick={() => setAuthModalOpen(true)}
                className={`${buttonStyle} ${className}`}
            >
                Sign In
            </Button>
            <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
        </>
    )
}