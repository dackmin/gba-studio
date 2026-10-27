import type { ComponentPropsWithoutRef } from 'react';
import { classNames } from '@junipero/react';

export interface CollisionIconProps extends ComponentPropsWithoutRef<'svg'> {
  active?: boolean;
}

const CollisionIcon = ({
  active = false,
  ...props
}: CollisionIconProps) => (
  <svg width={20} height={20} viewBox="0 0 16 16" { ...props }>
    <path
      d="M2 2H14V14H2Z"
      className={classNames(
        'fill-onyx dark:fill-seashell',
        { 'fill-seashell! dark:fill-seashell!': active },
      )}
    />
  </svg>
);

export default CollisionIcon;
