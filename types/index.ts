export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type PatientStatus = 'WAITING'|'WITH_DOCTOR'|'DONE'|'ABANDONED'|'BOOKED'|'ARRIVING_SOON'|'ARRIVED'|'MISSED'|'CANCELLED';
export type PatientType = 'WALK_IN'|'APPOINTMENT';
export type ConsultationMode = 'PHYSICAL'|'ONLINE';
export type MessageSender = 'ZERO'|'PATIENT'|'HUMAN';
export type MessageType = 'text'|'image'|'document'|'audio'|'video'|'sticker';
export type MessageStatus = 'sending'|'sent'|'delivered'|'failed';

export interface Patient {
  id: string;
  name: string;
  phone_number: string;
  age: number;
  gender: string;
  symptoms: string;
  complaint: string;
  urgency: UrgencyLevel;
  department: string;
  queue_number: number|null;
  status: PatientStatus;
  patient_type: PatientType;
  consultation_mode: ConsultationMode;
  appointment_time: string|null;
  arrival_timestamp: string|null;
  created_at: string;
  updated_at: string;
}

export interface DailyStats {
  total_today: number;
  waiting: number;
  with_doctor: number;
  completed: number;
  avg_wait_minutes: number;
}

export interface Conversation {
  id: string;
  patient_id: string|null;
  patient_name: string;
  phone_number: string;
  status: 'OPEN'|'RESOLVED';
  flagged: boolean;
  flag_reason: string|null;
  is_ai_paused: boolean;
  last_message: string|null;
  last_message_at: string|null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: MessageSender;
  body: string;
  type: MessageType;
  status: MessageStatus;
  media_id?: string;
  media_url?: string;
  media_mime_type?: string;
  media_filename?: string;
  timestamp: string;
  optimistic?: boolean;
}
