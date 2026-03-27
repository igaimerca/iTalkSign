import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isLowBandwidth: boolean;
  effectiveType: string | null;
}

function readStatus(): NetworkStatus {
  const conn =
    (navigator as any).connection ??
    (navigator as any).mozConnection ??
    (navigator as any).webkitConnection;
  const effectiveType: string | null = conn?.effectiveType ?? null;
  return {
    isOnline: navigator.onLine,
    isLowBandwidth: effectiveType === 'slow-2g' || effectiveType === '2g',
    effectiveType,
  };
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(readStatus);

  useEffect(() => {
    const update = () => setStatus(readStatus());
    const conn =
      (navigator as any).connection ??
      (navigator as any).mozConnection ??
      (navigator as any).webkitConnection;

    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    conn?.addEventListener('change', update);

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      conn?.removeEventListener('change', update);
    };
  }, []);

  return status;
}
