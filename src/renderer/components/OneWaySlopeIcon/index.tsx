import type { ComponentPropsWithoutRef } from 'react';
import { classNames } from '@junipero/react';

export interface OneWaySlopeIconProps extends ComponentPropsWithoutRef<'svg'> {
  tilt: 'left' | 'right';
  active?: boolean;
}

const OneWaySlopeIcon = ({
  tilt,
  active = false,
  ...props
}: OneWaySlopeIconProps) => {
  const className = classNames(
    'stroke-onyx dark:stroke-seashell',
    { 'stroke-seashell! dark:stroke-seashell!': active },
  );

  return (
    <svg width={20} height={20} viewBox="0 0 16 16" fill="none" { ...props }>
      <path
        d={tilt === 'left' ? 'M2 2L14 14H2Z' : 'M14 2V14H2Z'}
        strokeWidth={1}
        strokeDasharray="2 2"
        className={className}
      />
      <path
        d={tilt === 'left' ? 'M2 2L14 14' : 'M14 2L2 14'}
        strokeWidth={2}
        strokeLinecap="square"
        className={className}
      />
    </svg>
  );
};

export default OneWaySlopeIcon;

export const OneWaySlopeLeftIcon = (props: Omit<OneWaySlopeIconProps, 'tilt'>) =>
  <OneWaySlopeIcon tilt="left" { ...props } />;

export const OneWaySlopeRightIcon = (props: Omit<OneWaySlopeIconProps, 'tilt'>) =>
  <OneWaySlopeIcon tilt="right" { ...props } />;
