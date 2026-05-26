'use client';
import { LayoutDashboard, MessageSquare, HelpCircle, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';

interface SidebarProps {
  open: boolean; onToggle: () => void;
  view: 'dashboard'|'zerochat'; onView: (v: 'dashboard'|'zerochat') => void;
}

export function Sidebar({ open, onToggle, view, onView }: SidebarProps) {
  const { logout, clinicName } = useAuthStore();
  const conversations = useChatStore(s => s.conversations);

  const flagged = conversations.filter(c => c.flagged && c.status === 'OPEN').length;
  const unread = conversations.reduce((a, c) => a + (c.unread_count || 0), 0);
  const hasFlagged = flagged > 0;

  return (
    <aside className={`sidebar ${open ? 'open' : 'closed'}`}>
      {/* Header */}
      <div className="sb-head">
        <div className="sb-logo">Z</div>
        {open && <span className="sb-brand">Zero</span>}
        <button className="sb-toggle" onClick={onToggle} title={open ? 'Collapse' : 'Expand'}>
          {open ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="sb-nav">
        <button className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => onView('dashboard')}>
          <span className="nav-icon"><LayoutDashboard size={17} /></span>
          <span className="nav-label">Dashboard</span>
        </button>

        <button className={`nav-item ${view === 'zerochat' ? 'active' : ''}`} onClick={() => onView('zerochat')}>
          <span className="nav-icon"><MessageSquare size={17} /></span>
          <span className="nav-label">ZeroChat</span>
          {(unread > 0 || flagged > 0) && (
            <span className="nav-badge">{unread || flagged}</span>
          )}
          {hasFlagged && open && (
            <span className="needs-dot pulse" style={{marginLeft: 2}} />
          )}
        </button>
      </nav>

      {/* Clinic name */}
      {open && clinicName && (
        <div style={{padding:'0 12px 8px',fontSize:11,color:'var(--text3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {clinicName}
        </div>
      )}

      {/* Footer */}
      <div className="sb-footer">
        <button className="sb-foot-item">
          <HelpCircle size={16} style={{flexShrink:0}} />
          <span className="sb-foot-label">Support</span>
        </button>
        <button className="sb-foot-item" onClick={logout}>
          <LogOut size={16} style={{flexShrink:0}} />
          <span className="sb-foot-label">Log out</span>
        </button>
      </div>
    </aside>
  );
}
