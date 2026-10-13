import { type ChangeEvent, type KeyboardEvent, useCallback } from 'react';
import { Heading, Inset, ScrollArea, Separator, Tabs, Text } from '@radix-ui/themes';
import { classNames, set } from '@junipero/react';

import type { GameHud, SceneEvent } from '../../../types';
import { useApp } from '../../services/hooks';
import EventsField from '../../components/EventsField';

export interface HudFormProps {
  hud: GameHud;
  onChange?: (hud: GameHud) => void;
}

const HudForm = ({ hud, onChange }: HudFormProps) => {
  const { scenes } = useApp();
  const usedBy = scenes.filter(s => s.hud === hud.id);

  const onNameChange = useCallback((e: ChangeEvent<HTMLHeadingElement>) => {
    const name = (e.currentTarget.textContent || 'Untitled')
      .trim().slice(0, 32);

    if (name === hud.name) {
      return;
    }

    onChange?.({ ...hud, name });
  }, [onChange, hud]);

  const onNameKeyDown = (e: KeyboardEvent<HTMLHeadingElement>) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const onEventsChange = useCallback((name: string, value: SceneEvent[]) => {
    set(hud, name, value);
    onChange?.(hud);
  }, [onChange, hud]);

  return (
    <ScrollArea scrollbars="vertical">
      <div className="p-3">
        <Text size="1" className="text-slate">HUD</Text>
        <Heading
          contentEditable
          as="h2"
          size="4"
          className={classNames(
            'whitespace-nowrap overflow-scroll focus:outline-2',
            'outline-(--accent-9) rounded-xs editable',
          )}
          onKeyDown={onNameKeyDown}
          onBlur={onNameChange}
          suppressContentEditableWarning
        >
          { hud.name }
        </Heading>
        <Inset side="x"><Separator className="!w-full my-4" /></Inset>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Text className="block text-slate" size="1">Content</Text>
            <Text>
              { hud.sprites?.length || 0 } sprite(s),
              { ' ' }{ hud.texts?.length || 0 } text(s)
            </Text>
          </div>
          <div className="flex flex-col gap-1">
            <Text className="block text-slate" size="1">Used by</Text>
            <Text>
              { usedBy.length
                ? usedBy.map(s => s.name).join(', ')
                : 'No scene' }
            </Text>
          </div>
        </div>
        <Inset side="x"><Separator className="!w-full my-4" /></Inset>
        <div className="flex flex-col gap-2 pb-10">
          <Text className="block text-slate" size="1">Events</Text>
          <Inset className="!rounded-none !overflow-visible">
            <Tabs.Root defaultValue="init">
              <Tabs.List size="1" className="px-1">
                <Tabs.Trigger value="init">On Init</Tabs.Trigger>
                <Tabs.Trigger value="update">On Update</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="init">
                <EventsField
                  value={hud.events?.init ?? []}
                  onValueChange={onEventsChange.bind(null, 'events.init')}
                />
              </Tabs.Content>
              <Tabs.Content value="update">
                <EventsField
                  value={hud.events?.update ?? []}
                  onValueChange={onEventsChange.bind(null, 'events.update')}
                />
              </Tabs.Content>
            </Tabs.Root>
          </Inset>
        </div>
      </div>
    </ScrollArea>
  );
};

export default HudForm;
