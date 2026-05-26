'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Onboarding } from '@/components/Onboarding';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { ZeroChat } from '@/components/ZeroChat';
import { useSocket } from '@/hooks/useSocket';
import { useChatStore } from '@/store/chatStore';

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [view, setView] = useState<'dashboard'|'zerochat'>('dashboard');
  const connected = useChatStore(s => s.connected);

  useSocket();

  return (
    <div className="shell">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} view={view} onView={setView} />
      <div className="main">
        {/* Topbar */}
        <div className="topbar">
          <span className="topbar-title">{view === 'dashboard' ? 'Queue Dashboard' : 'ZeroChat'}</span>
          <div style={{flex:1}} />
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <div className={`conn ${connected ? 'ok' : 'err'}`} />
            <span className="conn-label">{connected ? 'Connected' : 'Offline'}</span>
          </div>
        </div>
        {/* Content */}
        <div style={{flex:1,overflow:'hidden'}}>
          {view === 'dashboard' ? <div style={{height:'100%',overflowY:'auto'}}><Dashboard /></div> : <ZeroChat />}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const { step, init } = useAuthStore();

  useEffect(() => { init(); }, [init]);

  if (step === 'dashboard') return <AppShell />;
  return <Onboarding />;
}
