import { classNames } from '@junipero/react';
import { Card } from '@radix-ui/themes';
import { type ResizableProps, Resizable } from 're-resizable';

import type { GameScene, GameScript } from '../../../types';
import { useCanvas } from '../../services/hooks';
import SceneForm from './SceneForm';
import ScriptForm from './ScriptForm';

export interface EditSidebarProps extends ResizableProps {
  onSceneChange?: (scene: GameScene) => void;
  onScriptChange?: (script: GameScript) => void;
}

const EditSidebar = ({
  className,
  onSceneChange,
  onScriptChange,
  ...rest
}: EditSidebarProps) => {
  const { selectedScene, selectedItem } = useCanvas();

  return (
    <Resizable
      defaultSize={{ width: 300 }}
      maxWidth="40%"
      minWidth={200}
      { ...rest }
      className={classNames(
        'flex-none pointer-events-auto',
        className,
      )}
    >
      <Card
        className={classNames(
          'w-full h-full bg-seashell dark:bg-onyx !p-0',
          'before:!rounded-none after:!rounded-none !rounded-none',
        )}
      >
        { selectedItem?.type === 'script' ? (
          <ScriptForm
            script={selectedItem}
            onChange={onScriptChange}
          />
        ) : selectedScene ? (
          <SceneForm
            scene={selectedScene}
            onChange={onSceneChange}
          />
        ) : (
          <div className="p-4">No selection</div>
        ) }
      </Card>
    </Resizable>
  );
};

export default EditSidebar;
