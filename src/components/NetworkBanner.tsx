import { useNetworkStatus } from '../hooks/useNetworkStatus';
import './NetworkBanner.css';

export default function NetworkBanner() {
  const { isOnline, isLowBandwidth } = useNetworkStatus();

  if (isOnline && !isLowBandwidth) return null;

  return (
    <div
      className={`network-banner network-banner--${isOnline ? 'slow' : 'offline'}`}
      role="alert"
      aria-live="polite"
    >
      {isOnline ? (
        <>
          <span className="network-banner__icon" aria-hidden="true">⚡</span>
          <span>Slow connection detected — images may load slowly.</span>
        </>
      ) : (
        <>
          <span className="network-banner__icon" aria-hidden="true">⚠</span>
          <span>You are offline. Some features may be unavailable.</span>
        </>
      )}
    </div>
  );
}
