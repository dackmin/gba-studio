import { classNames, InfiniteCanvas } from '@junipero/react';
import { Card } from '@radix-ui/themes';
import { Resizable } from 're-resizable';

import { useApp } from '../hooks';
import Scene from '../Scene';

const Canvas = () => {
  const { scenes } = useApp();

  return (
    <div
      className="w-screen h-screen relative flex items-stretch overflow-hidden"
    >
      <InfiniteCanvas
        className="flex-auto overflow-hidden"
      >
        <div className="flex items-start gap-8">
          { scenes.map(scene => (
            <Scene key={scene.name} scene={scene} />
          ))}
        </div>
      </InfiniteCanvas>
      <Resizable
        defaultSize={{ width: 400 }}
        maxWidth="80%"
        minWidth={400}
        className="editor-panel !h-[calc(100vh+2px)] -right-1 -top-1 flex-none"
      >
        <Card
          className={classNames(
            'w-full h-full',
            'bg-white dark:bg-black before:!rounded-none after:!rounded-none',
            '!rounded-none'
          )}
        >
          Sidebar
        </Card>
      </Resizable>
    </div>
  );
};

export default Canvas;
