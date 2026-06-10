'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

const PRACTICES = ['General Practice','Dental','Cardiology','Neurology','Pediatrics','Gynecology','Orthopedics','Dermatology','ENT','Ophthalmology','Other'];
const DAILY_PATIENTS = ['1–10','11–25','26–50','51–100','100+'];

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="step-indicator">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`step-dot ${i === current ? 'active' : ''}`} />
      ))}
    </div>
  );
}

function Step1() {
  const { setClinic } = useAuthStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');

  const submit = () => {
    if (!name.trim()) return setErr('Clinic name is required');
    if (!phone.trim() || phone.replace(/\D/g,'').length < 7) return setErr('Enter a valid phone number');
    setClinic(name.trim(), phone.trim(), email.trim());
  };

  return (
    <div className="ob-shell">
      <div className="ob-card fade-up">
        <StepDots current={0} total={4} />
        <h1 className="ob-title">Welcome to Zero</h1>
        <p className="ob-sub">Please enter clinic name and WhatsApp contact</p>
        <div className="ob-fields">
          <input className="field" placeholder="Enter clinic name" value={name} onChange={e => { setName(e.target.value); setErr(''); }} />
          <div className="phone-wrap">
            <span className="phone-pre">+234</span>
            <input className="phone-in" placeholder="xx xxxx xxxx" value={phone} onChange={e => { setPhone(e.target.value); setErr(''); }} />
          </div>
          <input className="field" placeholder="Email address (optional)" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          {err && <p style={{fontSize:12,color:'var(--red)'}}>{err}</p>}
        </div>
        <button className="btn-primary" onClick={submit} disabled={!name || !phone}>Continue</button>
      </div>
    </div>
  );
}

function Step2() {
  const { setTailor1 } = useAuthStore();
  const [practice, setPractice] = useState('');
  const [daily, setDaily] = useState('');

  return (
    <div className="ob-shell">
      <div className="ob-card fade-up">
        <StepDots current={1} total={4} />
        <h1 className="ob-title">Let's tailor Zero to you</h1>
        <p className="ob-sub">Please answer the following</p>
        <div className="ob-fields">
          <div className="select-wrap">
            <select value={practice} onChange={e => setPractice(e.target.value)}>
              <option value="" disabled>Select clinic practice</option>
              {PRACTICES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="select-wrap">
            <select value={daily} onChange={e => setDaily(e.target.value)}>
              <option value="" disabled>No. of daily patients</option>
              {DAILY_PATIENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setTailor1(practice, daily)} disabled={!practice || !daily}>Continue</button>
      </div>
    </div>
  );
}

function Step3() {
  const { setPin } = useAuthStore();
  const [pin, setPin2] = useState(['','','','']);
  const [confirm, setConfirm] = useState(['','','','']);
  const [stage, setStage] = useState<'create'|'confirm'>('create');
  const [err, setErr] = useState('');
  const refs = useRef<(HTMLInputElement|null)[]>([]);

  useEffect(() => { setTimeout(() => refs.current[0]?.focus(), 100); }, [stage]);

  const handleChange = (arr: string[], setArr: (v: string[]) => void, i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...arr]; next[i] = val.slice(-1); setArr(next); setErr('');
    if (val && i < 3) refs.current[i+1]?.focus();
    const full = next.join('');
    if (full.length === 4) {
      if (stage === 'create') { setTimeout(() => { setStage('confirm'); setConfirm(['','','','']); }, 150); }
      else {
        if (full === pin.join('')) { setPin(full); }
        else { setErr('PINs do not match'); setTimeout(() => { setConfirm(['','','','']); refs.current[0]?.focus(); }, 300); }
      }
    }
  };

  const arr = stage === 'create' ? pin : confirm;
  const setArr = stage === 'create' ? setPin2 : setConfirm;

  return (
    <div className="ob-shell">
      <div className="ob-card fade-up">
        <StepDots current={2} total={4} />
        <h1 className="ob-title">Set your PIN</h1>
        <p className="ob-sub">Please set your PIN for security</p>
        <div className="pin-row">
          {arr.map((d, i) => (
            <input key={`${stage}-${i}`} ref={el => { refs.current[i] = el; }}
              className={`pin-box${d ? ' filled' : ''}${err ? ' err' : ''}`}
              type="password" inputMode="numeric" maxLength={1} value={d}
              onChange={e => handleChange(arr, setArr, i, e.target.value)}
              onKeyDown={e => { if (e.key === 'Backspace' && !arr[i] && i > 0) refs.current[i-1]?.focus(); }}
            />
          ))}
        </div>
        {err && <p style={{fontSize:12,color:'var(--red)',textAlign:'center',marginBottom:12}}>{err}</p>}
        <p style={{fontSize:12,color:'var(--text3)',textAlign:'center',marginBottom:16}}>
          {stage === 'create' ? 'Create a 4-digit PIN' : 'Confirm your PIN'}
        </p>
        <button className="btn-primary" style={{opacity:.5,cursor:'not-allowed'}} disabled>Continue</button>
      </div>
    </div>
  );
}

function Step4() {
  const { setTailor2 } = useAuthStore();
  const [sel, setSel] = useState<boolean|null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (sel === null) return;
    setLoading(true);
    setError('');
    try {
      await setTailor2(sel);
    } catch (e: unknown) {
      setError((e as Error).message || 'Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ob-shell">
      <div className="ob-card fade-up">
        <StepDots current={3} total={4} />
        <h1 className="ob-title">Let's tailor Zero to you</h1>
        <p className="ob-sub">Please answer the following</p>
        <div className="ob-fields">
          <p style={{fontSize:13,color:'var(--text2)',lineHeight:1.6,marginBottom:4}}>
            Do you want to receive marketing emails and product updates from Zero? You can opt-out anytime.
          </p>
          <div className="radio-group">
            {[{label:'Yes, we do', val: true},{label:"No, we don't", val: false}].map(opt => (
              <div key={String(opt.val)} className={`radio-opt ${sel === opt.val ? 'selected' : ''}`} onClick={() => setSel(opt.val)}>
                <div className="radio-dot">{sel === opt.val && <div className="radio-dot-inner" />}</div>
                <span>{opt.label}</span>
              </div>
            ))}
          </div>
          {error && <p style={{color:'red',fontSize:13,marginTop:8}}>{error}</p>}
        </div>
        <button className="btn-primary" onClick={handleContinue} disabled={sel === null || loading}>
          {loading ? 'Setting up...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

function PinLogin() {
  const { login, clinicName } = useAuthStore();
  const [pin, setPin] = useState(['','','','']);
  const [err, setErr] = useState(false);
  const refs = useRef<(HTMLInputElement|null)[]>([]);
  useEffect(() => { setTimeout(() => refs.current[0]?.focus(), 100); }, []);

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...pin]; next[i] = val.slice(-1); setPin(next); setErr(false);
    if (val && i < 3) refs.current[i+1]?.focus();
    if (next.join('').length === 4) {
      login(next.join('')).then(ok => {
        if (!ok) { setErr(true); setTimeout(() => { setPin(['','','','']); setErr(false); refs.current[0]?.focus(); }, 600); }
      });
    }
  };

  return (
    <div className="ob-shell">
      <div className="ob-card fade-up">
        <h1 className="ob-title">Welcome back</h1>
        <p className="ob-sub">{clinicName || 'Enter your PIN to continue'}</p>
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
        {err && <p style={{fontSize:12,color:'var(--red)',textAlign:'center'}}>Incorrect PIN. Try again.</p>}
      </div>
    </div>
  );
}

export function Onboarding() {
  const { step } = useAuthStore();
  if (step === 'clinic') return <Step1 />;
  if (step === 'tailor1') return <Step2 />;
  if (step === 'pin') return <Step3 />;
  if (step === 'tailor2') return <Step4 />;
  return <PinLogin />;
}
