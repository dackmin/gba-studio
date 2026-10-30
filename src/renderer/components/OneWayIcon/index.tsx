import type { ComponentPropsWithoutRef } from 'react';
import { classNames } from '@junipero/react';

import type { CharacterDirection } from '../../../types';

export interface OneWayIconProps extends ComponentPropsWithoutRef<'svg'> {
  side: CharacterDirection;
  active?: boolean;
}

const SOLID_SIDES: Record<CharacterDirection, string> = {
  up: 'M2 2H14',
  down: 'M2 14H14',
  left: 'M2 2V14',
  right: 'M14 2V14',
};

const OneWayIcon = ({
  side,
  active = false,
  ...props
}: OneWayIconProps) => {
  const className = classNames(
    'stroke-onyx dark:stroke-seashell',
    { 'stroke-seashell! dark:stroke-seashell!': active },
  );

  return (
    <svg width={20} height={20} viewBox="0 0 16 16" fill="none" { ...props }>
      <path
        d="M2 2H14V14H2Z"
        strokeWidth={1}
        strokeDasharray="2 2"
        className={className}
      />
      <path
        d={SOLID_SIDES[side]}
        strokeWidth={2}
        strokeLinecap="square"
        className={className}
      />
    </svg>
  );
};

export default OneWayIcon;

export const OneWayTopIcon = (props: Omit<OneWayIconProps, 'side'>) =>
  <OneWayIcon side="up" { ...props } />;

export const OneWayBottomIcon = (props: Omit<OneWayIconProps, 'side'>) =>
  <OneWayIcon side="down" { ...props } />;

export const OneWayLeftIcon = (props: Omit<OneWayIconProps, 'side'>) =>
  <OneWayIcon side="left" { ...props } />;

export const OneWayRightIcon = (props: Omit<OneWayIconProps, 'side'>) =>
  <OneWayIcon side="right" { ...props } />;
