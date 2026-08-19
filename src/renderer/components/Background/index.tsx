import { type ComponentPropsWithoutRef, useMemo } from 'react';
import { classNames } from '@junipero/react';

import type { GameBackgroundFile } from '../../../types';

export interface BackgroundProps extends ComponentPropsWithoutRef<'img'> {
  background: Partial<GameBackgroundFile>;
  className?: string;
}

const Background = ({
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
      className={classNames('pixelated', className)}
      src={image}
      alt={background?.name || 'Background'}
      {...rest}
    />
  );
};

export default Background;
