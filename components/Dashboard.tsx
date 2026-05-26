'use client';
import { useState, useCallback } from 'react';
import { useQueue } from '@/hooks/useQueue';
import { useQueueStore } from '@/store/queueStore';
import { api } from '@/lib/api';
import { Patient, PatientStatus } from '@/types';
import { getQueue, getAppointments, getCompleted, fmtTime, waitMins, fmtWait, urgencyClass, statusClass, n } from '@/lib/utils';
import { RefreshCw, AlertTriangle, Clock, UserCheck } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';

export function Dashboard() {
  useQueue();
  const { patients, stats, loading, error, lastUpdated } = useQueueStore();
  const connected = useChatStore(s => s.connected);

  const [tab, setTab] = useState<'queue'|'appointments'|'completed'|'needs'>('queue');
  const [statFilter, setStatFilter] = useState<string|null>(null);
  const [selId, setSelId] = useState<string|null>(null);
  const [acting, setActing] = useState(false);

  const queue = getQueue(patients);
  const appts = getAppointments(patients);
  const done = getCompleted(patients);
  const flagged = useChatStore(s => s.conversations.filter(c => c.flagged && c.status === 'OPEN'));
  const hasFlagged = flagged.length > 0;

  const displayed = tab === 'queue' ? queue : tab === 'appointments' ? appts : tab === 'completed' ? done : [];
  const selPatient = patients.find(p => p.id === selId) || queue[0] || null;

  const act = useCallback(async (fn: () => Promise<unknown>) => {
    setActing(true);
    try { await fn(); } catch (e) { console.error(e); } finally { setActing(false); }
  }, []);

  const handleDone = (p: Patient) => act(() => api.updateStatus(p.id, 'DONE' as PatientStatus));
  const handleNext = () => act(() => api.nextPatient());
  const handleArrived = (p: Patient) => act(() => api.markArrived(p.id));
  const handleMissed = (p: Patient) => act(() => api.markMissed(p.id));

  return (
    <div className="main-inner" style={{paddingBottom:32}}>
      {/* Topbar info */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:700,color:'var(--text)'}}>Queue Dashboard</div>
          {lastUpdated && <div style={{fontSize:11,color:'var(--text3)'}}>Updated {lastUpdated.toLocaleTimeString('en-NG',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <div className={`conn ${connected ? 'ok' : 'err'}`} />
          <span className="conn-label">{connected ? 'Live' : 'Polling'}</span>
        </div>
        <button onClick={() => {}} style={{background:'none',border:'none',cursor:'pointer',padding:4,borderRadius:6,color:'var(--text3)',display:'flex'}}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {error && <div className="err-bar"><AlertTriangle size={13}/>{error} — retrying</div>}

      {/* Stats */}
      <div className="stat-grid">
        <div className={`stat-tile st-blue ${statFilter==='total'?'sel':''}`} onClick={() => setStatFilter(f => f==='total'?null:'total')}>
          <div className="stat-label">Total Today</div>
          <div className="stat-val mono">{String(stats?.total_today ?? 0).padStart(3,'0')}</div>
        </div>
        <div className={`stat-tile st-white ${statFilter==='doctor'?'sel':''}`} onClick={() => setStatFilter(f => f==='doctor'?null:'doctor')}>
          <div className="stat-label">With Doctor</div>
          <div className="stat-val mono">{String(stats?.with_doctor ?? 0).padStart(3,'0')}</div>
        </div>
        <div className={`stat-tile st-green ${statFilter==='completed'?'sel':''}`} onClick={() => setStatFilter(f => f==='completed'?null:'completed')}>
          <div className="stat-label">Completed</div>
          <div className="stat-val mono">{String(stats?.completed ?? 0).padStart(3,'0')}</div>
        </div>
        <div className={`stat-tile st-beige ${statFilter==='waiting'?'sel':''}`} onClick={() => setStatFilter(f => f==='waiting'?null:'waiting')}>
          <div className="stat-label">Waiting</div>
          <div className="stat-val mono">{String(stats?.waiting ?? 0).padStart(3,'0')}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-row">
        <button className={`tab ${tab==='queue'?'active':''}`} onClick={() => setTab('queue')}>Live Queue</button>
        <button className={`tab ${tab==='appointments'?'active':''}`} onClick={() => setTab('appointments')}>Appointments</button>
        <button className={`tab ${tab==='needs'?'active':''}`} onClick={() => setTab('needs')} style={{display:'flex',alignItems:'center',gap:6}}>
          {hasFlagged && <span className="tab-dot pulse" />}
          Needs Review
        </button>
        <button className={`tab ${tab==='completed'?'active':''}`} onClick={() => setTab('completed')}>Completed</button>
      </div>

      {/* Table */}
      <div className="card fade-up">
        {tab === 'queue' && (
          <div style={{overflowX:'auto'}}>
            <table className="qt">
              <thead>
                <tr>
                  <th>No.</th><th>Name</th><th>Arrival Time</th><th>Age</th><th>Gender</th><th>Symptoms</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.length === 0 ? (
                  <tr><td colSpan={8} className="empty-state">Queue is empty</td></tr>
                ) : queue.map(p => {
                  const wm = waitMins(p); const over = wm > 30 && n(p.status) === 'WAITING';
                  return (
                    <tr key={p.id} className={`${selId===p.id?'sel':''} ${over?'overdue':''}`} onClick={() => setSelId(p.id)}>
                      <td><span className="mono" style={{fontWeight:700}}>#{p.queue_number ?? '—'}</span></td>
                      <td><div style={{fontWeight:500}}>{p.name}</div><div style={{fontSize:11,color:'var(--text3)'}}>{p.department}</div></td>
                      <td><span className="mono" style={{fontSize:12}}>{fmtTime(p.created_at)}</span></td>
                      <td>{p.age}</td>
                      <td>{p.gender}</td>
                      <td style={{maxWidth:160}}><span style={{display:'-webkit-box',WebkitLineClamp:1,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{p.symptoms || p.complaint}</span></td>
                      <td><span className={statusClass(p.status)}>{n(p.status).replace('_',' ')}</span></td>
                      <td>
                        <div style={{display:'flex',gap:6}}>
                          {n(p.status) === 'WAITING' && <button className="btn-next" disabled={acting} onClick={e => { e.stopPropagation(); handleNext(); }}>Next</button>}
                          {n(p.status) === 'WITH_DOCTOR' && <button className="btn-done" disabled={acting} onClick={e => { e.stopPropagation(); handleDone(p); }}>Done</button>}
                          {over && <span title="Waiting > 30min"><AlertTriangle size={14} style={{color:'var(--orange)'}}/></span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'appointments' && (
          <div style={{overflowX:'auto'}}>
            <table className="qt">
              <thead><tr><th>Name</th><th>Time</th><th>Department</th><th>Urgency</th><th>Mode</th><th>Actions</th></tr></thead>
              <tbody>
                {appts.length === 0 ? (
                  <tr><td colSpan={6} className="empty-state">No upcoming appointments</td></tr>
                ) : appts.map(p => (
                  <tr key={p.id}>
                    <td style={{fontWeight:500}}>{p.name}</td>
                    <td><span className="mono" style={{fontSize:12}}>{p.appointment_time ? fmtTime(p.appointment_time) : '—'}</span></td>
                    <td>{p.department}</td>
                    <td><span className={urgencyClass(p.urgency)}>{p.urgency}</span></td>
                    <td>{p.consultation_mode === 'ONLINE' ? '🌐 Online' : '🏥 Physical'}</td>
                    <td>
                      <div style={{display:'flex',gap:6}}>
                        {p.consultation_mode !== 'ONLINE' && <button className="btn-next" onClick={() => handleArrived(p)}>Arrived</button>}
                        <button className="btn-done" onClick={() => handleMissed(p)}>Missed</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'needs' && (
          <div style={{padding:16}}>
            {flagged.length === 0
              ? <div className="empty-state">No conversations need review</div>
              : flagged.map(c => (
                <div key={c.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid #f3f4f6'}}>
                  <div className="av">{c.patient_name?.slice(0,2).toUpperCase()}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:13}}>{c.patient_name}</div>
                    <div style={{fontSize:12,color:'var(--text3)'}}>{c.flag_reason || 'Needs human attention'}</div>
                  </div>
                  <span className="needs-dot pulse" />
                </div>
              ))
            }
          </div>
        )}

        {tab === 'completed' && (
          <div style={{overflowX:'auto'}}>
            <table className="qt">
              <thead><tr><th>No.</th><th>Name</th><th>Department</th><th>Complaint</th><th>Done at</th></tr></thead>
              <tbody>
                {done.length === 0
                  ? <tr><td colSpan={5} className="empty-state">No completed patients yet</td></tr>
                  : done.map(p => (
                    <tr key={p.id}>
                      <td><span className="mono" style={{fontWeight:700}}>#{p.queue_number ?? '—'}</span></td>
                      <td style={{fontWeight:500}}>{p.name}</td>
                      <td>{p.department}</td>
                      <td style={{color:'var(--text2)'}}>{p.complaint}</td>
                      <td><span className="mono" style={{fontSize:12}}>{fmtTime(p.updated_at)}</span></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
