import { useMemo } from 'react';

import { useSprite } from '../../services/hooks';
import Switch from '../../components/Switch';
import SpriteForm from './SpriteForm';
import FrameForm from './FrameForm';

const RightSidebar = () => {
  const { selectedSprite, selectedFrame } = useSprite();

  const selectedItem = useMemo(() => (
    selectedFrame || selectedSprite
  ), [selectedFrame, selectedSprite]);

  return (
    <Switch value={selectedItem?.type || ''}>
      <Switch.Case value="frame">
        <FrameForm />
      </Switch.Case>
      <Switch.Case value="sprite">
        <SpriteForm />
      </Switch.Case>
      <Switch.Case default>
        <div className="p-4">No selection</div>
      </Switch.Case>
    </Switch>
  );
};

export default RightSidebar;
