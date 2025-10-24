import type { ComponentPropsWithoutRef } from 'react';
import { classNames } from '@junipero/react';

const FullscreenView = ({
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<'div'>) => {
  return (
    <div
      { ...rest }
      className={classNames(
        'w-screen h-screen relative flex items-stretch overflow-hidden',
        className,
      )}
    >
      { children }
    </div>
  );
};

export default FullscreenView;
