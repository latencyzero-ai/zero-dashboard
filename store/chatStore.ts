'use client';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Conversation, Message } from '@/types';

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  activeId: string|null;
  connected: boolean;
  setConversations: (c: Conversation[]) => void;
  upsertConversation: (c: Conversation) => void;
  setMessages: (id: string, msgs: Message[]) => void;
  setActiveId: (id: string|null) => void;
  setConnected: (v: boolean) => void;
  optimisticAdd: (convId: string, msg: Message) => void;
  confirmMessage: (convId: string, tempId: string, real: Message) => void;
  failMessage: (convId: string, tempId: string) => void;
  appendMessage: (convId: string, msg: Message) => void;
  setAiPaused: (convId: string, paused: boolean) => void;
  markRead: (convId: string) => void;
}

export const useChatStore = create<ChatState>()(immer((set, get) => ({
  conversations: [], messages: {}, activeId: null, connected: false,

  setConversations: (c) => set(s => { s.conversations = c; }),

  upsertConversation: (c) => set(s => {
    const i = s.conversations.findIndex(x => x.id === c.id);
    if (i >= 0) s.conversations[i] = c; else s.conversations.unshift(c);
  }),

  setMessages: (id, msgs) => set(s => { s.messages[id] = msgs; }),
  setActiveId: (id) => set(s => { s.activeId = id; }),
  setConnected: (v) => set(s => { s.connected = v; }),

  optimisticAdd: (convId, msg) => set(s => {
    if (!s.messages[convId]) s.messages[convId] = [];
    s.messages[convId].push(msg);
    const ci = s.conversations.findIndex(c => c.id === convId);
    if (ci >= 0) { s.conversations[ci].last_message = msg.body; s.conversations[ci].last_message_at = msg.timestamp; }
  }),

  confirmMessage: (convId, tempId, real) => set(s => {
    const msgs = s.messages[convId]; if (!msgs) return;
    const i = msgs.findIndex(m => m.id === tempId);
    if (i >= 0) msgs[i] = real;
  }),

  failMessage: (convId, tempId) => set(s => {
    const msgs = s.messages[convId]; if (!msgs) return;
    const i = msgs.findIndex(m => m.id === tempId);
    if (i >= 0) msgs[i].status = 'failed';
  }),

  appendMessage: (convId, msg) => set(s => {
    if (!s.messages[convId]) s.messages[convId] = [];
    if (s.messages[convId].some(m => m.id === msg.id)) return;
    s.messages[convId].push(msg);
    const ci = s.conversations.findIndex(c => c.id === convId);
    if (ci >= 0) {
      s.conversations[ci].last_message = msg.body;
      s.conversations[ci].last_message_at = msg.timestamp;
      if (convId !== get().activeId) s.conversations[ci].unread_count += 1;
    }
  }),

  setAiPaused: (convId, paused) => set(s => {
    const ci = s.conversations.findIndex(c => c.id === convId);
    if (ci >= 0) s.conversations[ci].is_ai_paused = paused;
  }),

  markRead: (convId) => set(s => {
    const ci = s.conversations.findIndex(c => c.id === convId);
    if (ci >= 0) s.conversations[ci].unread_count = 0;
  }),
})));
