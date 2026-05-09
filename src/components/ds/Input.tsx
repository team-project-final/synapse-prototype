import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', invalid = false, ...rest }, ref) => (
    <input
      ref={ref}
      className={[
        'w-full rounded-sm border bg-white px-3 py-2 text-stone-900 placeholder:text-stone-400',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-1',
        invalid ? 'border-[#DC2626]' : 'border-stone-300',
        className,
      ].join(' ')}
      {...rest}
    />
  ),
);
Input.displayName = 'Input';
