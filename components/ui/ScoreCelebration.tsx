import React, { useEffect, useMemo } from 'react';

type CelebrationTier = 'none' | 'excellence' | 'exceptional' | 'masterpiece';
type CelebrationVariant = 'full' | 'subtle';

interface ScoreCelebrationProps {
  score: number | undefined;
  children: React.ReactNode;
  variant?: CelebrationVariant;
}

// Haptic patterns for each tier
const hapticPatterns: Record<Exclude<CelebrationTier, 'none'>, number[]> = {
  excellence: [15, 30, 25],
  exceptional: [10, 50, 20, 50, 30],
  masterpiece: [10, 30, 15, 30, 20, 50, 40],
};

const getTier = (score: number | undefined): CelebrationTier => {
  if (score === undefined || score < 8) return 'none';
  if (score >= 9.5) return 'masterpiece';
  if (score >= 9) return 'exceptional';
  return 'excellence';
};

export const ScoreCelebration: React.FC<ScoreCelebrationProps> = ({ score, children, variant = 'full' }) => {
  const tier = useMemo(() => getTier(score), [score]);
  const isSubtle = variant === 'subtle';

  // Trigger haptic feedback on celebration (only for full variant)
  useEffect(() => {
    if (tier !== 'none' && !isSubtle && 'vibrate' in navigator) {
      navigator.vibrate(hapticPatterns[tier]);
    }
  }, [tier, isSubtle]);

  if (tier === 'none') {
    return <>{children}</>;
  }

  const tierNumber = tier === 'excellence' ? '1' : tier === 'exceptional' ? '2' : '3';

  return (
    <div className={`celebration-container celebration-tier-${tierNumber}${isSubtle ? ' celebration-subtle' : ''}`}>
      {/* Glow layer */}
      <div className={`celebration-glow glow-tier-${tierNumber}`} />

      {/* Corner brackets for Tier 2+ (full mode only) */}
      {!isSubtle && (tier === 'exceptional' || tier === 'masterpiece') && (
        <>
          <span className="corner-bracket corner-tl">「</span>
          <span className="corner-bracket corner-br">」</span>
        </>
      )}

      {/* Badge for Tier 2+ (full mode only) */}
      {!isSubtle && (tier === 'exceptional' || tier === 'masterpiece') && (
        <div className={`celebration-badge badge-tier-${tier === 'exceptional' ? '2' : '3'}`}>
          {tier === 'masterpiece' ? 'MASTERPIECE' : 'EXCEPTIONAL'}
        </div>
      )}

      {/* Decorative lines for Tier 3 (full mode only) */}
      {!isSubtle && tier === 'masterpiece' && (
        <>
          <div className="deco-line deco-line-left" />
          <div className="deco-line deco-line-right" />
        </>
      )}

      {/* Floating particles for Tier 2+ (full mode only) */}
      {!isSubtle && (tier === 'exceptional' || tier === 'masterpiece') && (
        <div className="celebration-particles">
          <span className="particle particle-1" />
          <span className="particle particle-2" />
          <span className="particle particle-3" />
        </div>
      )}

      {/* The actual score meter */}
      <div className="celebration-content">
        {children}
      </div>

      {/* Shimmer overlay for the bar (full mode only) */}
      {!isSubtle && (tier === 'exceptional' || tier === 'masterpiece') && (
        <div className="shimmer-overlay" />
      )}
    </div>
  );
};
