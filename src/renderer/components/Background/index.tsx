import { useMemo } from 'react';

import type { GameBackgroundFile } from '../../../types';

export interface BackgroundProps {
  background: GameBackgroundFile;
}

const Background = ({
  background,
}: BackgroundProps) => {
  const image = useMemo(() => (
    !background?._file
      ? `resources://public/templates/commons/graphics/bg_default.bmp`
      : `project://${background.path}`
  ), [background]);

  return (
    <img
      className="pixelated"
      src={image}
      alt=""
    />
  );
};

export default Background;
