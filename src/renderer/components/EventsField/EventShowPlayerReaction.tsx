import { useCallback, useMemo } from 'react';
import { Text, TextField } from '@radix-ui/themes';
import { set } from '@junipero/react';

import type { ShowPlayerReactionEvent } from '../../../types';
import { useAssets } from '../../services/hooks';
import { findSprite } from '../../../helpers';
import SpritesListField from '../SpritesListField';
import AnimationsListField from '../AnimationsListField';
import EventValueField, {
  EXCLUDE_ALL_EXCEPT_VALUE_AND_VARIABLES,
} from '../EventValueField';

export interface EventShowPlayerReactionProps {
  event: ShowPlayerReactionEvent;
  onValueChange?: (
    event: ShowPlayerReactionEvent,
  ) => void;
}

const EventShowPlayerReaction = ({
  event,
  onValueChange,
}: EventShowPlayerReactionProps) => {
  const { sprites } = useAssets();

  const onValueChange_ = useCallback((name: string, value: any) => {
    set(event, name, value);
    onValueChange?.(event);
  }, [onValueChange, event]);

  const sprite = useMemo(() => (
    findSprite(sprites, event?.sprite)
  ), [sprites, event?.sprite]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Bubble sprite</Text>
        <SpritesListField
          defaultGraphic="bubble_default"
          value={event.sprite ?? ''}
          onValueChange={onValueChange_.bind(null, 'sprite')}
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
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Duration</Text>
        <EventValueField
          excludeTypes={EXCLUDE_ALL_EXCEPT_VALUE_AND_VARIABLES}
          value={event.duration ?? 1000}
          onValueChange={onValueChange_.bind(null, 'duration')}
        >
          <TextField.Slot side="right">ms</TextField.Slot>
        </EventValueField>
      </div>
    </div>
  );
};

export default EventShowPlayerReaction;
