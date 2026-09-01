import { type ComponentPropsWithoutRef, type RefCallback, type RefObject, useMemo } from 'react';
import { classNames } from '@junipero/react';

import type { GameBackgroundFile } from '../../../types';

export interface BackgroundProps extends ComponentPropsWithoutRef<'img'> {
  ref?: RefCallback<HTMLImageElement> | RefObject<HTMLImageElement>;
  background: Partial<GameBackgroundFile>;
}

const Background = ({
  ref,
  background,
  className,
  ...rest
}: BackgroundProps) => {
  const image = useMemo(() => (
    background?.path?.startsWith('data:')
      ? background.path
      : !background?._file
        ? `resources://public/templates/commons/graphics/bg_default.bmp`
        : `project://${background.path}`
  ), [background]);

  return (
    <img
      ref={ref}
      src={image}
      alt={background?.name || 'Background'}
      { ...rest }
      className={classNames('pixelated', className)}
    />
  );
};

export default Background;
