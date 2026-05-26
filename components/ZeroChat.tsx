'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '@/store/chatStore';
import { api } from '@/lib/api';
import { Message, Conversation } from '@/types';
import { initials, fmtRelative, fmtTime, fileIcon } from '@/lib/utils';
import { Send, Bot, BotOff, CheckCheck, Check, X, Download, Play, Pause } from 'lucide-react';


// ── Media bubble ──────────────────────────────────────
function MediaBubble({ msg, isOut }: { msg: Message; isOut: boolean }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaUrl = msg.media_url || (msg.media_id ? api.getMediaUrl(msg.media_id) : null);

  if (msg.type === 'image' && mediaUrl) {
    return (
      <div className="media-img" onClick={() => window.open(mediaUrl, '_blank')}>
        <img src={mediaUrl} alt="Image" loading="lazy" />
      </div>
    );
  }

  if (msg.type === 'document' && mediaUrl) {
    return (
      <a className="media-doc" href={mediaUrl} download={msg.media_filename || 'document'} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
        <span style={{fontSize:20}}>{fileIcon(msg.media_mime_type)}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{msg.media_filename || 'Document'}</div>
          <div style={{fontSize:11,color:'var(--text3)'}}>Tap to download</div>
        </div>
        <Download size={15} style={{flexShrink:0,color:'var(--text3)'}} />
      </a>
    );
  }

  if (msg.type === 'audio' && mediaUrl) {
    return (
      <div className="media-audio" style={{display:'flex',alignItems:'center',gap:10}}>
        <button onClick={() => {
          if (!audioRef.current) { audioRef.current = new Audio(mediaUrl); audioRef.current.onended = () => setPlaying(false); }
          if (playing) { audioRef.current.pause(); setPlaying(false); }
          else { audioRef.current.play(); setPlaying(true); }
        }} style={{background:'none',border:'none',cursor:'pointer',color:isOut?'white':'var(--navy)',display:'flex',alignItems:'center'}}>
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <div style={{flex:1,height:3,background:'rgba(0,0,0,.15)',borderRadius:2}} />
        <span style={{fontSize:11,color:'var(--text3)'}}>Audio</span>
      </div>
    );
  }

  if (msg.type === 'video' && mediaUrl) {
    return (
      <video controls style={{maxWidth:220,borderRadius:10,display:'block'}} onClick={e => e.stopPropagation()}>
        <source src={mediaUrl} type={msg.media_mime_type || 'video/mp4'} />
      </video>
    );
  }

  return <span style={{fontSize:12,color:'var(--text3)',fontStyle:'italic'}}>[{msg.type} message]</span>;
}

// ── Single bubble ─────────────────────────────────────
function Bubble({ msg }: { msg: Message }) {
  const isOut = msg.sender === 'HUMAN';
  const isZero = msg.sender === 'ZERO';
  const cls = isOut ? 'out' : isZero ? 'zero' : 'in';
  const bubbleCls = `bubble ${cls}${msg.status === 'sending' ? ' sending' : ''}${msg.status === 'failed' ? ' failed' : ''}`;

  return (
    <div className={`bw ${isOut ? 'out' : 'in'}`}>
      {msg.type === ('text' as string)
        ? <div className={bubbleCls}>{msg.body}</div>
        : <div className={bubbleCls} style={{padding:msg.type!=='text'?'6px':undefined}}><MediaBubble msg={msg} isOut={isOut} /></div>
      }
      <div className="bmeta">
        {isZero && <span style={{fontSize:10,color:'#60a5fa',fontWeight:600}}>ZERO</span>}
        <span>{fmtTime(msg.timestamp)}</span>
        {isOut && (
          msg.status === 'sending' ? <span style={{fontSize:10}}>Sending...</span>
          : msg.status === 'failed' ? <span style={{fontSize:10,color:'var(--red)'}}>Failed</span>
          : msg.status === 'delivered' ? <CheckCheck size={11} style={{color:'#60a5fa'}} />
          : <Check size={11} />
        )}
      </div>
    </div>
  );
}

// ── Conversation item ─────────────────────────────────
function ConvoItem({ convo, active, onClick }: { convo: Conversation; active: boolean; onClick: () => void }) {
  const dotColor = convo.flagged ? 'var(--orange)' : convo.is_ai_paused ? 'var(--green)' : '#d1d5db';
  return (
    <div className={`ci ${active ? 'active' : ''} ${convo.flagged ? 'flagged' : ''}`} onClick={onClick}>
      <div className="av">{initials(convo.patient_name || '?')}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:6}}>
          <span style={{fontWeight:600,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{convo.patient_name}</span>
          <span style={{fontSize:10,color:'var(--text3)',flexShrink:0}}>{convo.last_message_at ? fmtRelative(convo.last_message_at) : ''}</span>
        </div>
        <div style={{fontSize:12,color:'var(--text3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:2}}>
          {convo.last_message || convo.phone_number}
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0}}>
        <div style={{width:8,height:8,borderRadius:'50%',background:dotColor,animation:convo.flagged?'pulseDot 3s infinite':undefined}} />
        {convo.unread_count > 0 && <span className="nav-badge" style={{fontSize:10}}>{convo.unread_count}</span>}
      </div>
    </div>
  );
}

// ── Thread ────────────────────────────────────────────
function Thread({ convo }: { convo: Conversation }) {
  const { messages, optimisticAdd, confirmMessage, failMessage, setAiPaused, markRead } = useChatStore();
  const msgs = messages[convo.id] || [];
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api.getMessages(convo.id).then(ms => useChatStore.getState().setMessages(convo.id, ms));
    markRead(convo.id);
  }, [convo.id, markRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length]);

  const send = useCallback(async () => {
    const body = text.trim();
    if (!body || sending) return;
    setText('');

    // Generate temp id using timestamp (no uuid dep needed)
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic: Message = {
      id: tempId, conversation_id: convo.id,
      sender: 'HUMAN', body, type: 'text',
      status: 'sending', timestamp: new Date().toISOString(), optimistic: true,
    };

    optimisticAdd(convo.id, optimistic);
    setSending(true);

    try {
      const real = await api.sendMessage(convo.id, body);
      confirmMessage(convo.id, tempId, { ...real, status: 'delivered' });
    } catch {
      failMessage(convo.id, tempId);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [text, sending, convo.id, optimisticAdd, confirmMessage, failMessage]);

  const toggleAi = useCallback(async () => {
    const next = !convo.is_ai_paused;
    setAiPaused(convo.id, next); // optimistic
    try { await api.setAiPaused(convo.id, next); }
    catch { setAiPaused(convo.id, !next); } // revert
  }, [convo.id, convo.is_ai_paused, setAiPaused]);

  const resolve = useCallback(async () => {
    try { await api.resolveConversation(convo.id); }
    catch (e) { console.error(e); }
  }, [convo.id]);

  const isPaused = convo.is_ai_paused;

  return (
    <div className="zc-thread">
      {/* Thread header */}
      <div className="zc-thread-head">
        <div className="av" style={{width:34,height:34,fontSize:12}}>{initials(convo.patient_name || '?')}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{convo.patient_name}</div>
          <div style={{fontSize:11,color:'var(--text3)'}}>{convo.phone_number}</div>
        </div>
        <div style={{display:'flex',gap:6,flexShrink:0}}>
          <button className={`toggle-btn ${isPaused ? 'toggle-resume' : 'toggle-pause'}`} onClick={toggleAi} title={isPaused ? 'Resume Zero' : 'Take Over (Pause Zero)'}>
            {isPaused ? <><Bot size={13} style={{marginRight:4,verticalAlign:'middle'}} />Resume Zero</> : <><BotOff size={13} style={{marginRight:4,verticalAlign:'middle'}} />Take Over</>}
          </button>
          <button className="toggle-btn toggle-resolve" onClick={resolve}>
            <X size={13} style={{marginRight:4,verticalAlign:'middle'}} />Resolve
          </button>
        </div>
      </div>

      {/* AI paused banner */}
      {isPaused && (
        <div className="ai-bar">
          <span>🤚 You are in control — Zero is paused for this conversation</span>
          <button className="toggle-btn toggle-resume" onClick={toggleAi} style={{padding:'3px 10px'}}>Resume Zero</button>
        </div>
      )}

      {/* Messages */}
      <div className="zc-messages">
        {msgs.length === 0
          ? <div className="zc-empty">No messages yet</div>
          : msgs.map(m => <Bubble key={m.id} msg={m} />)
        }
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      <div className="reply-wrap">
        <textarea ref={inputRef}
          className="reply-input"
          placeholder={isPaused ? 'Type a message...' : 'Take over to reply manually...'}
          disabled={!isPaused}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          rows={1}
        />
        <button className="reply-send" disabled={!isPaused || !text.trim() || sending} onClick={send}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

// ── ZeroChat root ─────────────────────────────────────
export function ZeroChat() {
  const { conversations, activeId, setActiveId } = useChatStore();
  const active = conversations.find(c => c.id === activeId) || null;

  useEffect(() => {
    api.getConversations().then(cs => useChatStore.getState().setConversations(cs));
  }, []);

  const sorted = [...conversations].sort((a, b) => {
    if (a.flagged && !b.flagged) return -1;
    if (!a.flagged && b.flagged) return 1;
    return new Date(b.last_message_at || b.updated_at).getTime() - new Date(a.last_message_at || a.updated_at).getTime();
  });

  const flaggedCount = conversations.filter(c => c.flagged && c.status === 'OPEN').length;

  return (
    <div className="zc-shell" style={{height:'calc(100vh - 56px)'}}>
      {/* List */}
      <div className="zc-list">
        <div className="zc-list-head">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span>Conversations</span>
            {flaggedCount > 0 && (
              <div style={{display:'flex',alignItems:'center',gap:5,fontSize:12,color:'var(--orange)',fontWeight:600}}>
                <span className="needs-dot pulse" />
                {flaggedCount} flagged
              </div>
            )}
          </div>
        </div>
        <div className="zc-list-inner">
          {sorted.length === 0
            ? <div className="empty-state">No conversations</div>
            : sorted.map(c => (
              <ConvoItem key={c.id} convo={c} active={c.id === activeId}
                onClick={() => setActiveId(c.id)} />
            ))
          }
        </div>
      </div>

      {/* Thread or empty */}
      {active
        ? <Thread key={active.id} convo={active} />
        : <div className="zc-empty" style={{flex:1}}>Select a conversation</div>
      }
    </div>
  );
}
