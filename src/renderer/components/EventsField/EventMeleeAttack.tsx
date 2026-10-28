import { useCallback } from 'react';
import { Select, Text, TextField } from '@radix-ui/themes';
import { set } from '@junipero/react';

import type { MeleeAttackEvent } from '../../../types';
import ActorListField from '../ActorListField';
import SpritesListField from '../SpritesListField';
import EventValueField, {
  EXCLUDE_ALL_EXCEPT_VALUE_AND_VARIABLES,
} from '../EventValueField';

export interface EventMeleeAttackProps {
  event: MeleeAttackEvent;
  onValueChange?: (
    event: MeleeAttackEvent,
  ) => void;
}

const EventMeleeAttack = ({
  event,
  onValueChange,
}: EventMeleeAttackProps) => {
  const onValueChange_ = useCallback((name: string, value: any) => {
    set(event, name, value);
    onValueChange?.(event);
  }, [onValueChange, event]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Source</Text>
        <Select.Root
          value={event.sourceType ?? ''}
          onValueChange={onValueChange_.bind(null, 'sourceType')}
        >
          <Select.Trigger placeholder="Select source" />
          <Select.Content>
            <Select.Item value="actor">Actor</Select.Item>
            <Select.Item value="player">Player</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
      { event.sourceType === 'actor' && (
        <div className="flex flex-col gap-2">
          <Text size="1" className="text-slate">Actor</Text>
          <ActorListField
            value={event.actor ?? ''}
            onValueChange={onValueChange_.bind(null, 'actor')}
          />
        </div>
      ) }
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Weapon sprite</Text>
        <SpritesListField
          value={event.sprite ?? ''}
          onValueChange={onValueChange_.bind(null, 'sprite')}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Duration</Text>
        <EventValueField
          excludeTypes={EXCLUDE_ALL_EXCEPT_VALUE_AND_VARIABLES}
          value={event.duration ?? 200}
          onValueChange={onValueChange_.bind(null, 'duration')}
        >
          <TextField.Slot side="right">ms</TextField.Slot>
        </EventValueField>
      </div>
    </div>
  );
};

export default EventMeleeAttack;
