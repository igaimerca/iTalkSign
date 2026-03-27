import { manifest } from '../lib/manifest';

interface SignCardProps {
  char: string;
  active?: boolean;
  isLowBandwidth: boolean;
  role?: string;
  'aria-current'?: 'true' | undefined;
}

export default function SignCard({ char, active, isLowBandwidth, ...rest }: SignCardProps) {
  const label = char === ' ' ? 'spc' : char;
  const ariaLabel = char === ' ' ? 'space' : char;

  return (
    <div
      className={`sign-card${active ? ' sign-card--active' : ''}`}
      aria-label={`ASL sign for ${ariaLabel}`}
      {...rest}
    >
      {manifest[char] ? (
        isLowBandwidth ? (
          <div className="sign-card__low-bw">{char}</div>
        ) : (
          <img
            src={manifest[char]}
            alt={`ASL hand sign for ${ariaLabel}`}
            className="sign-card__img"
            loading="lazy"
            decoding="async"
          />
        )
      ) : (
        <span className="sign-card__symbol">{char === ' ' ? '␣' : char}</span>
      )}
      <span className="sign-card__letter">{label}</span>
    </div>
  );
}
