import { useCallback, useMemo } from 'react';
import { set } from '@junipero/react';
import { Text } from '@radix-ui/themes';

import type { SetPlayerAnimationEvent } from '../../../types';
import { findSprite } from '../../../helpers';
import { useAssets, useSceneForm } from '../../services/hooks';
import AnimationsListField from '../AnimationsListField';

export interface EventSetPlayerAnimationProps {
  event: SetPlayerAnimationEvent;
  onValueChange?: (
    event: SetPlayerAnimationEvent,
  ) => void;
}

const EventSetPlayerAnimation = ({
  event,
  onValueChange,
}: EventSetPlayerAnimationProps) => {
  const { sprites } = useAssets();
  const { scene } = useSceneForm();

  const onValueChange_ = useCallback((name: string, value: any) => {
    set(event, name, value);
    onValueChange?.(event);
  }, [onValueChange, event]);

  const sprite = useMemo(() => (
    findSprite(sprites, scene?.player?.sprite)
  ), [sprites, scene?.player?.sprite]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Animation</Text>
        <AnimationsListField
          sprite={sprite}
          value={event.animation || ''}
          onValueChange={onValueChange_.bind(null, 'animation')}
        />
      </div>
    </div>
  );
};

export default EventSetPlayerAnimation;
