import { classNames } from '@junipero/react';
import { Card } from '@radix-ui/themes';

import type { GameScene } from '../../../types';
import { useCanvas } from '../../services/hooks';
import SceneForm from './SceneForm';

export interface SidebarProps {
  onSceneChange?: (scene: GameScene) => void;
}

const Sidebar = ({
  onSceneChange,
}: SidebarProps) => {
  const { selectedScene, selectedItem } = useCanvas();

  return (
    <Card
      className={classNames(
        'w-full h-full bg-seashell dark:bg-onyx !p-0',
        'before:!rounded-none after:!rounded-none !rounded-none',
      )}
    >
      { selectedItem ? (
        <></>
      ) : selectedScene ? (
        <SceneForm
          scene={selectedScene}
          onChange={onSceneChange}
        />
      ) : (
        <div className="p-4">No selection</div>
      ) }
    </Card>
  );
};

export default Sidebar;
