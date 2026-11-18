import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import type { IconName } from '@stripe-clone/icons';
import { cx } from '@/lib/cx';
import { Icon } from './icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  icon?: IconName;
  children?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

/** Text button in the Dashboard's two sizes (28px default, 26px small). */
export function Button({ variant = 'secondary', size = 'md', icon, className, children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx('button', `button--${variant}`, size === 'sm' && 'button--sm', className)}
      {...rest}
    >
      {icon ? <Icon name={icon} size={12} /> : null}
      {children !== undefined ? <span className="button__label">{children}</span> : null}
    </button>
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  /** Required: icon-only controls must have an accessible name. */
  label: string;
  size?: 'sm' | 'md' | 'lg';
  iconSize?: 12 | 16;
  outlined?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export function IconButton({ icon, label, size = 'md', iconSize = 12, outlined, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cx('icon-button', size !== 'md' && `icon-button--${size}`, outlined && 'icon-button--outlined', className)}
      {...rest}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  );
}
