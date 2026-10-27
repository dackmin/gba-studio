import type { ComponentPropsWithoutRef } from 'react';
import { classNames } from '@junipero/react';

export interface SlopeRightIconProps extends ComponentPropsWithoutRef<'svg'> {
  active?: boolean;
}

const SlopeRightIcon = ({
  active = false,
  ...props
}: SlopeRightIconProps) => (
  <svg width={20} height={20} viewBox="0 0 16 16" { ...props }>
    <path
      d="M14 2V14H2Z"
      className={classNames(
        'fill-onyx dark:fill-seashell',
        { 'fill-seashell! dark:fill-seashell!': active },
      )}
    />
  </svg>
);

export default SlopeRightIcon;
