'use client';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Patient, DailyStats } from '@/types';

interface QueueState {
  patients: Patient[]; stats: DailyStats|null; loading: boolean; error: string|null; lastUpdated: Date|null;
  setPatients: (p: Patient[]) => void; setStats: (s: DailyStats) => void;
  setLoading: (v: boolean) => void; setError: (e: string|null) => void; setLastUpdated: (d: Date) => void;
}

export const useQueueStore = create<QueueState>()(immer((set) => ({
  patients: [], stats: null, loading: true, error: null, lastUpdated: null,
  setPatients: (p) => set(s => { s.patients = p; }),
  setStats: (st) => set(s => { s.stats = st; }),
  setLoading: (v) => set(s => { s.loading = v; }),
  setError: (e) => set(s => { s.error = e; }),
  setLastUpdated: (d) => set(s => { s.lastUpdated = d; }),
})));
