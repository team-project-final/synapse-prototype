import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  elevated?: boolean;
}

export function Card({ children, elevated = false, className = '', ...rest }: CardProps) {
  return (
    <div
      className={[
        'rounded-md bg-stone-100 p-4',
        elevated ? 'shadow-md' : 'shadow-sm',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}
