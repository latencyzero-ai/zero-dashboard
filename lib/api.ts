import axios from 'axios';
import { Patient, DailyStats, PatientStatus, Conversation, Message } from '@/types';

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  headers: { 'Content-Type': 'application/json' },
  timeout: 12000,
});

export const api = {
  getPatients: () => http.get<Patient[]>('/api/patients').then(r => r.data),

  getStats: async (): Promise<DailyStats> => {
    try {
      return (await http.get<DailyStats>('/api/stats/today')).data;
    } catch {
      const patients = await api.getPatients();
      const today = new Date().toDateString();
      const tp = patients.filter(p => new Date(p.created_at).toDateString() === today);
      const n = (s: string) => (s||'').toUpperCase();
      return {
        total_today: tp.length,
        waiting: tp.filter(p => n(p.status) === 'WAITING').length,
        with_doctor: tp.filter(p => n(p.status) === 'WITH_DOCTOR').length,
        completed: tp.filter(p => n(p.status) === 'DONE').length,
        avg_wait_minutes: 0,
      };
    }
  },

  updateStatus: (id: string, status: PatientStatus) =>
    http.patch<Patient>(`/api/patients/${id}/status`, { status }).then(r => r.data),

  nextPatient: () =>
    http.post<{ success: boolean; patient?: Patient }>('/api/queue/next').then(r => r.data),

  markArrived: (id: string) =>
    http.patch<Patient>(`/api/patients/${id}/status`, { status: 'ARRIVED', generate_queue: true }).then(r => r.data),

  markMissed: (id: string) =>
    http.patch<Patient>(`/api/patients/${id}/status`, { status: 'MISSED' }).then(r => r.data),

  getConversations: () =>
    http.get<Conversation[]>('/api/conversations').then(r => r.data).catch(() => [] as Conversation[]),

  getMessages: (convId: string) =>
    http.get<Message[]>(`/api/conversations/${convId}/messages`).then(r => r.data).catch(() => [] as Message[]),

  sendMessage: (convId: string, body: string) =>
    http.post<Message>(`/api/conversations/${convId}/reply`, { body }).then(r => r.data),

  resolveConversation: (convId: string) =>
    http.patch(`/api/conversations/${convId}/resolve`),

  setAiPaused: (convId: string, paused: boolean) =>
    http.patch(`/api/conversations/${convId}/ai-pause`, { paused }),

  getMediaUrl: (mediaId: string) =>
    `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/media/${mediaId}`,
};
