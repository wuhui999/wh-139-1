import React, { useMemo } from 'react';

interface SnowfallEffectProps {
  count?: number;
}

interface Snowflake {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

export default function SnowfallEffect({ count = 50 }: SnowfallEffectProps) {
  const snowflakes = useMemo<Snowflake[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 6 + 2,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * -20,
      opacity: Math.random() * 0.5 + 0.3,
    }));
  }, [count]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <style>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-10vh) translateX(0) rotate(0deg);
          }
          50% {
            transform: translateY(50vh) translateX(20px) rotate(180deg);
          }
          100% {
            transform: translateY(110vh) translateX(-20px) rotate(360deg);
          }
        }
      `}</style>
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute rounded-full"
          style={{
            left: `${flake.left}%`,
            top: '-10px',
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            boxShadow: '0 0 4px rgba(255, 255, 255, 0.6)',
            opacity: flake.opacity,
            animation: `snowfall ${flake.duration}s linear infinite`,
            animationDelay: `${flake.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
