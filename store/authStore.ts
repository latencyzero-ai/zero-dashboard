'use client';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { api } from '@/lib/api';

type Step = 'clinic'|'tailor1'|'pin'|'tailor2'|'pin-login'|'dashboard';

interface AuthState {
  step: Step;
  clinicName: string;
  clinicId: number;
  phoneNumber: string;
  email: string;
  clinicPractice: string;
  dailyPatients: string;
  marketingConsent: boolean|null;
  isAuthenticated: boolean;
  pendingPin: string;
  init: () => void;
  setClinic: (name: string, phone: string, email: string) => void;
  setTailor1: (practice: string, daily: string) => void;
  setPin: (pin: string) => void;
  setTailor2: (consent: boolean) => Promise<void>;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(immer((set, get) => ({
  step: 'clinic', clinicName: '', clinicId: 0, phoneNumber: '', email: '',
  clinicPractice: '', dailyPatients: '', marketingConsent: null, isAuthenticated: false,
  pendingPin: '',

  init: () => {
    if (typeof window === 'undefined') return;
    const auth = sessionStorage.getItem('zero_auth');
    const name = localStorage.getItem('zero_clinic_name') || '';
    const phone = localStorage.getItem('zero_clinic_phone') || '';
    const id = parseInt(localStorage.getItem('zero_clinic_id') || '0', 10);
    const hasClinic = !!name && id > 0;
    if (auth === 'true' && hasClinic) {
      set(s => { s.isAuthenticated = true; s.clinicName = name; s.clinicId = id; s.phoneNumber = phone; s.step = 'dashboard'; });
    } else if (hasClinic) {
      set(s => { s.clinicName = name; s.clinicId = id; s.phoneNumber = phone; s.step = 'pin-login'; });
    }
  },

  setClinic: (name, phone, email) => {
    localStorage.setItem('zero_clinic_name', name);
    localStorage.setItem('zero_clinic_phone', phone);
    set(s => { s.clinicName = name; s.phoneNumber = phone; s.email = email; s.step = 'tailor1'; });
  },

  setTailor1: (practice, daily) => {
    set(s => { s.clinicPractice = practice; s.dailyPatients = daily; s.step = 'pin'; });
  },

  setPin: (pin) => {
    set(s => { s.pendingPin = pin; s.step = 'tailor2'; });
  },

  setTailor2: async (consent) => {
    const { clinicName, phoneNumber, pendingPin } = get();
    try {
      const result = await api.setupClinic({ clinic_name: clinicName, phone_number: phoneNumber, pin: pendingPin });
      localStorage.setItem('zero_clinic_id', String(result.clinic_id));
      localStorage.setItem('zero_clinic_name', result.clinic_name);
      sessionStorage.setItem('zero_auth', 'true');
      set(s => {
        s.clinicId = result.clinic_id;
        s.clinicName = result.clinic_name;
        s.marketingConsent = consent;
        s.isAuthenticated = true;
        s.step = 'dashboard';
      });
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Setup failed';
      throw new Error(msg);
    }
  },

  login: async (pin) => {
    try {
      const result = await api.authPin(pin);
      localStorage.setItem('zero_clinic_id', String(result.clinic_id));
      localStorage.setItem('zero_clinic_name', result.clinic_name);
      sessionStorage.setItem('zero_auth', 'true');
      set(s => {
        s.isAuthenticated = true;
        s.clinicId = result.clinic_id;
        s.clinicName = result.clinic_name;
        s.step = 'dashboard';
      });
      return true;
    } catch {
      return false;
    }
  },

  logout: () => {
    sessionStorage.removeItem('zero_auth');
    set(s => { s.isAuthenticated = false; s.step = 'pin-login'; });
  },
})));
