import { useMemo } from 'react';
import { Text } from '@radix-ui/themes';

import { useSprite } from '../../services/hooks';
import Switch from '../../components/Switch';
import SpriteForm from './SpriteForm';
import FrameForm from './FrameForm';
import BackgroundForm from './BackgroundForm';
import FontForm from './FontForm';

const RightSidebar = () => {
  const {
    selectedSprite, selectedBackground, selectedFont, selectedFrame,
  } = useSprite();

  const selectedItem = useMemo(() => (
    selectedFrame || selectedSprite || selectedBackground || selectedFont
  ), [selectedFrame, selectedSprite, selectedBackground, selectedFont]);

  return (
    <Switch value={selectedItem?.type || ''}>
      <Switch.Case value="frame">
        <FrameForm />
      </Switch.Case>
      <Switch.Case value="sprite">
        <SpriteForm />
      </Switch.Case>
      <Switch.Case value="background">
        <BackgroundForm />
      </Switch.Case>
      <Switch.Case value="font">
        <FontForm />
      </Switch.Case>
      <Switch.Case default>
        <div className="w-full h-full flex items-center justify-center p-4">
          <Text size="1" className="text-slate">No selection</Text>
        </div>
      </Switch.Case>
    </Switch>
  );
};

export default RightSidebar;
