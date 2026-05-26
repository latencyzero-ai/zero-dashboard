'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useChatStore } from '@/store/chatStore';
import { Message, Conversation } from '@/types';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { setConnected, appendMessage, upsertConversation, setAiPaused } = useChatStore();

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    if (!url) return;

    const socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    // New inbound message from patient via Meta webhook
    socket.on('new_message', ({ conversationId, message }: { conversationId: string; message: Message }) => {
      appendMessage(conversationId, message);
    });

    // Conversation updated (flagged, status change, etc.)
    socket.on('conversation_updated', ({ conversation }: { conversation: Conversation }) => {
      upsertConversation(conversation);
    });

    // AI pause toggled from backend
    socket.on('ai_paused', ({ conversationId, paused }: { conversationId: string; paused: boolean }) => {
      setAiPaused(conversationId, paused);
    });

    return () => { socket.disconnect(); };
  }, [setConnected, appendMessage, upsertConversation, setAiPaused]);

  return socketRef;
}
