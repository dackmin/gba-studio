import { Moveable, useInfiniteCanvas } from '@junipero/react';
import { Card } from '@radix-ui/themes';
import { useMemo } from 'react';

import type { GameScene } from '../types';
import { useApp } from '../hooks';

export interface SceneProps {
  scene: GameScene;
}

const Scene = ({
  scene,
}: SceneProps) => {
  const { zoom } = useInfiniteCanvas();
  const { projectBase } = useApp();

  const backgroundPath = useMemo(() => scene.background ? (
    `project://graphics/${scene.background}.bmp`
  ) : '', [projectBase, scene]);

  return (
    <Moveable transformScale={zoom}>
      <div className="relative select-none">
        <Card
          className="bg-cover bg-center"
          style={{
            backgroundImage: `url(${backgroundPath})`,
            contain: 'none',
            imageRendering: 'pixelated',
            width: Math.max(240,
              (scene.map?.width || 0) * (scene.map?.gridSize || 16)),
            height: Math.max(160,
              (scene.map?.height || 0) * (scene.map?.gridSize || 16)),
          }}
        >
        </Card>
        <span className="absolute left-0 bottom-full">{ scene.name }</span>
      </div>
    </Moveable>
  );
};

export default Scene;
