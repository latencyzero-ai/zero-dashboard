'use client';
import { useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useQueueStore } from '@/store/queueStore';

export function useQueue() {
  const { setPatients, setStats, setLoading, setError, setLastUpdated, ...state } = useQueueStore();

  const fetch = useCallback(async () => {
    try {
      const [patients, stats] = await Promise.all([api.getPatients(), api.getStats()]);
      setPatients(patients); setStats(stats); setError(null); setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection error');
    } finally { setLoading(false); }
  }, [setPatients, setStats, setError, setLastUpdated, setLoading]);

  useEffect(() => {
    fetch();
    const t = setInterval(fetch, 5000);
    return () => clearInterval(t);
  }, [fetch]);

  return { ...state, refresh: fetch };
}
