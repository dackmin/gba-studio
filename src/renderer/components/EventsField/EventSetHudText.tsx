import { set } from '@junipero/react';
import { Select, Text } from '@radix-ui/themes';

import type { EventValue, SetHudTextEvent } from '../../../types';
import { useApp, useHudForm } from '../../services/hooks';
import EventValueField from '../EventValueField';

const EXCLUDED_TYPES = [
  'saved-game', 'player-attribute', 'direction', 'collision-side', 'scene',
  'actor',
];

export interface EventSetHudTextProps {
  event: SetHudTextEvent;
  onValueChange?: (event: SetHudTextEvent) => void;
}

const EventSetHudText = ({
  event,
  onValueChange,
}: EventSetHudTextProps) => {
  const { huds } = useApp();
  const { hud: currentHud } = useHudForm();
  const hudId = event.hud || currentHud?.id || '';
  const hud = huds.find(h => h.id === hudId);

  const onHudChange = (id: string) => {
    set(event, 'hud', id);
    set(event, 'text', '');
    onValueChange?.(event);
  };

  const onTextChange = (id: string) => {
    set(event, 'hud', hudId);
    set(event, 'text', id);
    onValueChange?.(event);
  };

  const onContentChange = (value: EventValue) => {
    set(event, 'value', value);
    onValueChange?.(event);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">HUD</Text>
        <Select.Root value={hudId} onValueChange={onHudChange}>
          <Select.Trigger placeholder="Select" />
          <Select.Content>
            { huds.map(item => (
              <Select.Item key={item.id} value={item.id}>
                { item.id === currentHud?.id ? 'This HUD' : item.name }
              </Select.Item>
            )) }
          </Select.Content>
        </Select.Root>
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Text</Text>
        <Select.Root value={event.text || ''} onValueChange={onTextChange}>
          <Select.Trigger placeholder="Select" />
          <Select.Content>
            { (hud?.texts ?? []).map(item => (
              <Select.Item key={item.id} value={item.id}>
                { item.name }
              </Select.Item>
            )) }
          </Select.Content>
        </Select.Root>
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Value</Text>
        <EventValueField
          type="text"
          maxLength={30}
          excludeTypes={EXCLUDED_TYPES}
          value={event.value ?? ''}
          onValueChange={onContentChange}
        />
      </div>
    </div>
  );
};

export default EventSetHudText;
