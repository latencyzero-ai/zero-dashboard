'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

function ClinicSetup() {
  const { setClinic } = useAuthStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState('');

  const submit = () => {
    if (!name.trim()) return setErr('Clinic name is required');
    if (!phone.trim() || phone.length < 7) return setErr('Enter a valid phone number');
    setErr('');
    setClinic(name.trim(), '+234' + phone.replace(/^0/, '').replace(/\D/g, ''));
  };

  return (
    <div className="ob-shell">
      <div className="ob-card fade-up">
        <div className="ob-divider" />
        <h1 className="ob-title">Welcome to Zero</h1>
        <p className="ob-sub">Please enter clinic name and WhatsApp contact</p>
        <div className="ob-fields">
          <input className="field" placeholder="Enter clinic name" value={name} onChange={e => { setName(e.target.value); setErr(''); }} />
          <div className="phone-wrap">
            <span className="phone-prefix">+234</span>
            <input className="phone-input" placeholder="xx xxxx xxxx" value={phone} onChange={e => { setPhone(e.target.value); setErr(''); }} />
          </div>
          {err && <p style={{fontSize:12,color:'var(--red)'}}>{err}</p>}
        </div>
        <button className="btn-primary" onClick={submit} disabled={!name || !phone}>Continue</button>
      </div>
    </div>
  );
}

function PinCreate() {
  const { createPin } = useAuthStore();
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirm, setConfirm] = useState(['', '', '', '']);
  const [stage, setStage] = useState<'create'|'confirm'>('create');
  const [err, setErr] = useState('');
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { refs.current[0]?.focus(); }, [stage]);

  const handleChange = (arr: string[], setArr: (v: string[]) => void, i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...arr]; next[i] = val.slice(-1); setArr(next); setErr('');
    if (val && i < 3) refs.current[i + 1]?.focus();
    const full = next.join('');
    if (full.length === 4) {
      if (stage === 'create') {
        setTimeout(() => { setStage('confirm'); setConfirm(['','','','']); }, 120);
      } else {
        if (full === pin.join('')) { createPin(full); }
        else { setErr('PINs do not match'); setConfirm(['','','','']); refs.current[0]?.focus(); }
      }
    }
  };

  const arr = stage === 'create' ? pin : confirm;
  const setArr = stage === 'create' ? setPin : setConfirm;

  return (
    <div className="ob-shell">
      <div className="ob-card fade-up">
        <div className="ob-divider" />
        <h1 className="ob-title">Welcome to Zero</h1>
        <p className="ob-sub">{stage === 'create' ? 'Create your 4-digit PIN' : 'Confirm your PIN'}</p>
        <div className="pin-row">
          {arr.map((d, i) => (
            <input key={i} ref={el => { refs.current[i] = el; }}
              className={`pin-box${d ? ' filled' : ''}${err ? ' err' : ''}`}
              type="password" inputMode="numeric" maxLength={1} value={d}
              onChange={e => handleChange(arr, setArr, i, e.target.value)}
              onKeyDown={e => { if (e.key === 'Backspace' && !arr[i] && i > 0) refs.current[i-1]?.focus(); }}
            />
          ))}
        </div>
        {err && <p style={{fontSize:12,color:'var(--red)',textAlign:'center'}}>{err}</p>}
        {stage === 'create'
          ? <button className="btn-primary" disabled>You're all set!</button>
          : <button className="btn-primary" onClick={() => { if (arr.join('') === pin.join('')) createPin(arr.join('')); else { setErr('PINs do not match'); setConfirm(['','','','']); } }}>You're all set!</button>
        }
      </div>
    </div>
  );
}

function PinLogin() {
  const { login, clinicName } = useAuthStore();
  const [pin, setPin] = useState(['', '', '', '']);
  const [err, setErr] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => { refs.current[0]?.focus(); }, []);

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...pin]; next[i] = val.slice(-1); setPin(next); setErr(false);
    if (val && i < 3) refs.current[i + 1]?.focus();
    if (next.join('').length === 4) {
      const ok = login(next.join(''));
      if (!ok) { setErr(true); setTimeout(() => { setPin(['','','','']); setErr(false); refs.current[0]?.focus(); }, 600); }
    }
  };

  return (
    <div className="ob-shell">
      <div className="ob-card fade-up">
        <div className="ob-divider" />
        <h1 className="ob-title">Welcome back</h1>
        <p className="ob-sub">{clinicName || 'Enter your 4-digit PIN to continue'}</p>
        <div className="pin-row">
          {pin.map((d, i) => (
            <input key={i} ref={el => { refs.current[i] = el; }}
              className={`pin-box${d ? ' filled' : ''}${err ? ' err' : ''}`}
              type="password" inputMode="numeric" maxLength={1} value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => { if (e.key === 'Backspace' && !pin[i] && i > 0) refs.current[i-1]?.focus(); }}
            />
          ))}
        </div>
        {err && <p style={{fontSize:12,color:'var(--red)',textAlign:'center'}}>Incorrect PIN</p>}
      </div>
    </div>
  );
}

export function Onboarding() {
  const { step } = useAuthStore();
  if (step === 'clinic') return <ClinicSetup />;
  if (step === 'pin-create') return <PinCreate />;
  return <PinLogin />;
}
