import { useEffect, useState } from 'react';

export function CelebrationParticles({
  count = 20,
  duration = 600,
}: {
  count?: number;
  duration?: number;
}) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), duration);
    return () => clearTimeout(t);
  }, [duration]);

  if (!show) return null;
  const particles = Array.from({ length: count }, (_, i) => i);
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((i) => {
        const angle = (i / count) * Math.PI * 2;
        const distance = 80 + Math.random() * 60;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        const color = i % 2 === 0 ? '#D97706' : '#0D9488';
        return (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
            style={{
              backgroundColor: color,
              transform: `translate(${dx}px, ${dy}px)`,
              transition: `transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity ${duration}ms ease-out`,
              opacity: 0,
            }}
          />
        );
      })}
    </div>
  );
}
