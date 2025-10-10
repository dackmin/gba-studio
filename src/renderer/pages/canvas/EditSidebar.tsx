import { classNames } from '@junipero/react';
import { Card } from '@radix-ui/themes';
import { type ResizableProps, Resizable } from 're-resizable';

import type { GameScene, GameScript, GameSensor } from '../../../types';
import { useCanvas } from '../../services/hooks';
import SceneForm from './SceneForm';
import ScriptForm from './ScriptForm';
import SensorForm from './SensorForm';
import Switch from '../../components/Switch';

export interface EditSidebarProps extends ResizableProps {
  onSceneChange?: (scene?: GameScene) => void;
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
        <Switch value={selectedItem?.type || ''}>
          <Switch.Case value="script">
            <ScriptForm
              script={selectedItem as GameScript}
              onChange={onScriptChange}
            />
          </Switch.Case>
          <Switch.Case value="sensor">
            <SensorForm
              sensor={selectedItem as GameSensor}
              onChange={onSceneChange}
            />
          </Switch.Case>
          <Switch.Case default>
            { selectedScene ? (
              <SceneForm
                scene={selectedScene}
                onChange={onSceneChange}
              />
            ) : (
              <div className="p-4">No selection</div>
            ) }
          </Switch.Case>
        </Switch>
      </Card>
    </Resizable>
  );
};

export default EditSidebar;
