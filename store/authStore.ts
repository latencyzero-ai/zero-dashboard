'use client';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

type Step = 'clinic'|'pin-create'|'pin-login'|'dashboard';

interface AuthState {
  step: Step; clinicName: string; phoneNumber: string; isAuthenticated: boolean;
  init: () => void;
  setClinic: (name: string, phone: string) => void;
  createPin: (pin: string) => void;
  login: (pin: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(immer((set) => ({
  step: 'clinic', clinicName: '', phoneNumber: '', isAuthenticated: false,

  init: () => {
    if (typeof window === 'undefined') return;
    const auth = sessionStorage.getItem('zero_auth');
    const name = localStorage.getItem('zero_clinic_name') || '';
    const phone = localStorage.getItem('zero_clinic_phone') || '';
    const hasPin = !!localStorage.getItem('zero_pin');
    if (auth === 'true' && name) {
      set(s => { s.isAuthenticated = true; s.clinicName = name; s.phoneNumber = phone; s.step = 'dashboard'; });
    } else if (hasPin && name) {
      set(s => { s.clinicName = name; s.phoneNumber = phone; s.step = 'pin-login'; });
    }
  },

  setClinic: (name, phone) => {
    localStorage.setItem('zero_clinic_name', name);
    localStorage.setItem('zero_clinic_phone', phone);
    set(s => { s.clinicName = name; s.phoneNumber = phone; s.step = 'pin-create'; });
  },

  createPin: (pin) => {
    localStorage.setItem('zero_pin', pin);
    sessionStorage.setItem('zero_auth', 'true');
    set(s => { s.isAuthenticated = true; s.step = 'dashboard'; });
  },

  login: (pin) => {
    const stored = localStorage.getItem('zero_pin');
    const env = process.env.NEXT_PUBLIC_CLINIC_PIN;
    if (pin === stored || pin === env) {
      sessionStorage.setItem('zero_auth', 'true');
      const name = localStorage.getItem('zero_clinic_name') || '';
      const phone = localStorage.getItem('zero_clinic_phone') || '';
      set(s => { s.isAuthenticated = true; s.clinicName = name; s.phoneNumber = phone; s.step = 'dashboard'; });
      return true;
    }
    return false;
  },

  logout: () => {
    sessionStorage.removeItem('zero_auth');
    set(s => { s.isAuthenticated = false; s.step = 'pin-login'; });
  },
})));
