'use client'

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LogInButton from "@/src/components/auth/LoginButton";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.replace('/dashboard');
    }
  }, [status, session, router]);


  return (
    <div className='min-h-screen bg-white flex flex-col'>

      {/* Navbar */}
      <nav className='flex items-center justify-between px-8 py-4 border-b border-gray-100'>
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center'>
            <svg className='w-4 h-4 stroke-white fill-none' viewBox='0 0 24 24' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
              <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
            </svg>
          </div>
          <span className='text-base font-medium text-gray-900 tracking-tight'>ChatApp</span>
        </div>
        <div className='flex items-center gap-4'>
          <span className='hidden sm:block text-sm text-gray-500 cursor-pointer hover:text-gray-900'>Features</span>
          <span className='hidden sm:block text-sm text-gray-500 cursor-pointer hover:text-gray-900'>About</span>
          <LogInButton />
        </div>
      </nav>

      {/* Hero */}
      <section className='flex flex-col items-center text-center px-8 pt-20 pb-12 flex-1'>
        <div className='flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 text-xs text-gray-500 mb-6'>
          <span className='w-1.5 h-1.5 rounded-full bg-green-500'></span>
          Now available for everyone
        </div>

        <h1 className='text-4xl font-medium text-gray-900 leading-tight tracking-tight max-w-md mb-4'>
          Chat freely.<br />
          <span className='text-gray-400'>Connect with it.</span>
        </h1>

        <p className='text-sm text-gray-500 max-w-sm leading-relaxed mb-8'>
          Fast, secure, and beautiful messaging for everyone. Stay connected with the people who matter.
        </p>

        <LogInButton size="lg" />

        {/* App mockup */}
        <div className='mt-12 w-full max-w-lg border border-gray-200 rounded-xl overflow-hidden'>
          <div className='flex items-center gap-1.5 px-3 py-2.5 border-b border-gray-100 bg-gray-50'>
            <div className='w-2.5 h-2.5 rounded-full bg-red-400'></div>
            <div className='w-2.5 h-2.5 rounded-full bg-yellow-400'></div>
            <div className='w-2.5 h-2.5 rounded-full bg-green-400'></div>
          </div>
          <div className='flex h-52 bg-white'>
            {/* Sidebar */}
            <div className='w-10 border-r border-gray-100 flex flex-col items-center py-3 gap-2'>
              <div className='w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center'>
                <svg className='w-3.5 h-3.5 fill-gray-900' viewBox='0 0 24 24'>
                  <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
                </svg>
              </div>
              <div className='w-7 h-7 rounded-lg flex items-center justify-center'>
                <svg className='w-3.5 h-3.5 stroke-gray-400 fill-none' viewBox='0 0 24 24' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
                  <circle cx='11' cy='11' r='8' /><line x1='21' y1='21' x2='16.65' y2='16.65' />
                </svg>
              </div>
              <div className='w-6 h-6 rounded-full bg-blue-100 mt-auto mb-1'></div>
            </div>
            {/* Chat list */}
            <div className='w-36 border-r border-gray-100'>
              <div className='px-2.5 py-2 text-xs font-medium text-gray-900 border-b border-gray-100'>Chats</div>
              <div className='p-1.5 flex flex-col gap-0.5'>
                {[
                  { name: 'Mayank', msg: 'Hey, what\'s up?', color: 'bg-blue-100', unread: 2 },
                  { name: 'Priya', msg: 'See you tomorrow!', color: 'bg-pink-100', unread: 0 },
                  { name: 'Rahul', msg: 'Sounds good bro', color: 'bg-green-100', unread: 0 },
                ].map((chat) => (
                  <div key={chat.name} className={`flex items-center gap-1.5 px-1.5 py-1.5 rounded-lg ${chat.name === 'Mayank' ? 'bg-gray-50' : ''}`}>
                    <div className={`w-6 h-6 rounded-full ${chat.color} flex-shrink-0`}></div>
                    <div className='flex-1 min-w-0'>
                      <div className='text-[10px] font-medium text-gray-900'>{chat.name}</div>
                      <div className='text-[9px] text-gray-400 truncate'>{chat.msg}</div>
                    </div>
                    {chat.unread > 0 && (
                      <div className='w-3.5 h-3.5 rounded-full bg-gray-900 text-white text-[8px] flex items-center justify-center flex-shrink-0'>{chat.unread}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* Chat window */}
            <div className='flex-1 flex flex-col'>
              <div className='flex items-center gap-2 px-3 py-2 border-b border-gray-100'>
                <div className='w-5 h-5 rounded-full bg-blue-100'></div>
                <div>
                  <div className='text-[10px] font-medium text-gray-900'>Mayank</div>
                  <div className='text-[9px] text-green-500'>Online</div>
                </div>
              </div>
              <div className='flex-1 p-2.5 flex flex-col gap-1.5'>
                <div className='self-start bg-gray-100 text-gray-800 text-[9px] px-2 py-1 rounded-lg max-w-[65%]'>Hey! Are you free today?</div>
                <div className='self-end bg-gray-900 text-white text-[9px] px-2 py-1 rounded-lg max-w-[65%]'>Yes! What's the plan?</div>
                <div className='self-start bg-gray-100 text-gray-800 text-[9px] px-2 py-1 rounded-lg max-w-[65%]'>Let's catch up at 5pm</div>
                <div className='self-end bg-gray-900 text-white text-[9px] px-2 py-1 rounded-lg max-w-[65%]'>Perfect, see you then!</div>
              </div>
              <div className='flex items-center gap-1.5 px-2.5 py-2 border-t border-gray-100'>
                <div className='flex-1 h-6 rounded-full bg-gray-50 border border-gray-100 text-[9px] text-gray-400 flex items-center px-2'>Type a message...</div>
                <div className='w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center'>
                  <svg className='w-2.5 h-2.5 stroke-white fill-none' viewBox='0 0 24 24' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
                    <line x1='22' y1='2' x2='11' y2='13' /><polygon points='22 2 15 22 11 13 2 9 22 2' fill='white' />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 mt-10 w-full max-w-lg'>
          {[
            { title: 'Encrypted', desc: 'Every message is private and secure.', icon: '🔒' },
            { title: 'Real-time', desc: 'Messages delivered instantly.', icon: '⚡' },
            { title: 'Group chats', desc: 'Chat with multiple people at once.', icon: '👥' },
          ].map((f) => (
            <div key={f.title} className='p-3.5 border border-gray-100 rounded-xl text-left'>
              <div className='text-base mb-2'>{f.icon}</div>
              <div className='text-xs font-medium text-gray-900 mb-1'>{f.title}</div>
              <div className='text-xs text-gray-400 leading-relaxed'>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className='text-center py-5 border-t border-gray-100 text-xs text-gray-400'>
        © 2026 ChatApp. All rights reserved.
      </footer>

    </div>
  );
}