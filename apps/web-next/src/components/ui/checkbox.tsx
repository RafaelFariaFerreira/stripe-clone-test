'use client';

import { useEffect, useRef, type InputHTMLAttributes } from 'react';
import { cx } from '@/lib/cx';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  indeterminate?: boolean;
}

/** Native checkbox restyled by `.checkbox`; supports the indeterminate state. */
export function Checkbox({ indeterminate = false, className, ...rest }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return <input ref={ref} type="checkbox" className={cx('checkbox', className)} {...rest} />;
}
