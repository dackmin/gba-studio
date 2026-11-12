import { useCallback, useMemo } from 'react';
import { set } from '@junipero/react';
import { Text } from '@radix-ui/themes';

import type { SetActorAnimationEvent } from '../../../types';
import { findSprite } from '../../../helpers';
import { useAssets, useSceneForm } from '../../services/hooks';
import ActorListField from '../ActorListField';
import AnimationsListField from '../AnimationsListField';

export interface EventSetActorAnimationProps {
  event: SetActorAnimationEvent;
  onValueChange?: (
    event: SetActorAnimationEvent,
  ) => void;
}

const EventSetActorAnimation = ({
  event,
  onValueChange,
}: EventSetActorAnimationProps) => {
  const { sprites } = useAssets();
  const { scene } = useSceneForm();

  const onValueChange_ = useCallback((name: string, value: any) => {
    set(event, name, value);
    onValueChange?.(event);
  }, [onValueChange, event]);

  const actor = useMemo(() => (
    scene?.actors?.find(actor => actor.id === event?.actor)
  ), [scene, event?.actor]);

  const sprite = useMemo(() => (
    findSprite(sprites, actor?.sprite)
  ), [sprites, actor?.sprite]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Actor</Text>
        <ActorListField
          value={event.actor || ''}
          onValueChange={onValueChange_.bind(null, 'actor')}
        />
      </div>
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

export default EventSetActorAnimation;
