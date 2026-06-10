import axios from 'axios';
import { Patient, DailyStats, PatientStatus, Conversation, Message, Order, OrderStatus, Product } from '@/types';

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  headers: { 'Content-Type': 'application/json' },
  timeout: 12000,
});

function clinicId(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem('zero_clinic_id') || '0', 10);
}

export const api = {
  authPin: (pin: string) =>
    http.post<{ clinic_id: number; clinic_name: string; agent_name: string }>('/api/auth/pin', { pin }).then(r => r.data),

  setupClinic: (data: { clinic_name: string; phone_number?: string; pin: string }) =>
    http.post<{ clinic_id: number; clinic_name: string; agent_name: string }>('/api/clinic/setup', data).then(r => r.data),

  getPatients: () =>
    http.get<Patient[]>('/api/patients', { params: { clinic_id: clinicId() } }).then(r => r.data),

  getStats: async (): Promise<DailyStats> => {
    try {
      return (await http.get<DailyStats>('/api/stats/today', { params: { clinic_id: clinicId() } })).data;
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
    http.post<{ success: boolean; patient?: Patient }>('/api/queue/next', { clinic_id: clinicId() }).then(r => r.data),

  markArrived: (id: string) =>
    http.patch<Patient>(`/api/patients/${id}/status`, { status: 'ARRIVED', generate_queue: true, clinic_id: clinicId() }).then(r => r.data),

  markMissed: (id: string) =>
    http.patch<Patient>(`/api/patients/${id}/status`, { status: 'MISSED' }).then(r => r.data),

  getConversations: () =>
    http.get<Conversation[]>('/api/conversations', { params: { clinic_id: clinicId() } }).then(r => r.data).catch(() => [] as Conversation[]),

  getMessages: (convId: string) =>
    http.get<Message[]>(`/api/conversations/${convId}/messages`, { params: { clinic_id: clinicId() } }).then(r => r.data).catch(() => [] as Message[]),

  sendMessage: (convId: string, body: string) =>
    http.post<Message>(`/api/conversations/${convId}/reply`, { body, clinic_id: clinicId() }).then(r => r.data),

  resolveConversation: (convId: string) =>
    http.patch(`/api/conversations/${convId}/resolve`),

  setAiPaused: (convId: string, paused: boolean) =>
    http.patch(`/api/conversations/${convId}/ai-pause`, { paused }),

  getMediaUrl: (mediaId: string) =>
    `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/media/${mediaId}`,

  // ── Pharmacy ──────────────────────────────────────────
  getOrders: (pharmacyId: number) =>
    http.get<Order[]>(`/api/pharmacy/${pharmacyId}/orders`).then(r => r.data).catch(() => [] as Order[]),

  advanceOrderStatus: (orderId: number, status: OrderStatus) =>
    http.patch<{ order: Order }>(`/api/pharmacy/orders/${orderId}/status`, { status }).then(r => r.data.order),

  confirmManualPayment: (orderId: number) =>
    http.post<{ order: Order }>(`/api/pharmacy/orders/${orderId}/confirm-payment`).then(r => r.data.order),

  getProducts: (pharmacyId: number) =>
    http.get<Product[]>(`/api/pharmacy/${pharmacyId}/products`).then(r => r.data).catch(() => [] as Product[]),

  updateProduct: (productId: number, patch: { price?: number; active?: boolean }) =>
    http.patch<{ product: Product }>(`/api/pharmacy/products/${productId}`, patch).then(r => r.data.product),

  adjustStock: (productId: number, change: number, reason: 'RESTOCK' | 'ADJUST') =>
    http.post<{ product: Product }>(`/api/pharmacy/products/${productId}/stock`, { change, reason }).then(r => r.data.product),
};
