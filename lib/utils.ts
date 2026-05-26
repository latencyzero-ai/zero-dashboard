import { Patient, UrgencyLevel } from '@/types';

export const n = (s: string) => (s||'').toUpperCase();

export function waitMins(p: Patient): number {
  return Math.floor((Date.now() - new Date(p.arrival_timestamp || p.created_at).getTime()) / 60000);
}

export function fmtWait(m: number): string {
  if (m < 1) return '< 1m';
  if (m < 60) return `${m}m`;
  return `${Math.floor(m/60)}h ${m%60}m`;
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-NG', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Africa/Lagos'
  });
}

export function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

export function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function urgencyClass(u: UrgencyLevel): string {
  return { LOW: 'u-low', MEDIUM: 'u-medium', HIGH: 'u-high', CRITICAL: 'u-critical' }[u] ?? 'u-low';
}

export function statusClass(s: string): string {
  const k = n(s).replace(' ', '_');
  return `s-${k.toLowerCase()}`;
}

export function getQueue(patients: Patient[]): Patient[] {
  return patients
    .filter(p => ['WAITING','WITH_DOCTOR'].includes(n(p.status)) && (p.patient_type||'WALK_IN').toUpperCase() !== 'APPOINTMENT')
    .sort((a, b) => (a.queue_number ?? 999) - (b.queue_number ?? 999));
}

export function getAppointments(patients: Patient[]): Patient[] {
  return patients
    .filter(p => (p.patient_type||'').toUpperCase() === 'APPOINTMENT' && ['BOOKED','ARRIVING_SOON'].includes(n(p.status)))
    .sort((a, b) => new Date(a.appointment_time!).getTime() - new Date(b.appointment_time!).getTime());
}

export function getCompleted(patients: Patient[]): Patient[] {
  return patients.filter(p => n(p.status) === 'DONE')
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export function fileIcon(mime?: string): string {
  if (!mime) return '📎';
  if (mime.startsWith('image/')) return '🖼️';
  if (mime.startsWith('audio/')) return '🎵';
  if (mime.startsWith('video/')) return '🎬';
  if (mime.includes('pdf')) return '📄';
  return '📎';
}
