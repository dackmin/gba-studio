import { type ChangeEvent, type KeyboardEvent, useCallback } from 'react';
import {
  Heading,
  Inset,
  Separator,
  Tabs,
  Text,
  TextField,
  Tooltip,
} from '@radix-ui/themes';
import { classNames, set } from '@junipero/react';
import { InfoCircledIcon } from '@radix-ui/react-icons';

import type { GameActor, GameScene } from '../../../types';
import { useCanvas, useDelayedCallback } from '../../services/hooks';
import EventsField from '../../components/EventsField';
import SpritesListField from '../../components/SpritesListField';
import DirectionField from '../../components/DirectionField';

export interface ActorFormProps {
  actor: GameActor;
  onChange?: (scene?: GameScene) => void;
}

const ActorForm = ({
  actor,
  onChange,
}: ActorFormProps) => {
  const { selectedScene } = useCanvas();
  const onDelayedChange = useDelayedCallback(onChange, 300);

  const onNameChange = useCallback((e: ChangeEvent<HTMLHeadingElement>) => {
    const name = (e.currentTarget.textContent || 'Untitled')
      .trim().slice(0, 32);

    if (name === actor.name) {
      return;
    }

    set(actor, 'name', name);
    onChange?.(selectedScene);
  }, [onChange, actor, selectedScene]);

  const onNameKeyDown = (e: KeyboardEvent<HTMLHeadingElement>) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const onValueChange = useCallback((name: string, value: any) => {
    set(actor, name, value);
    onChange?.(selectedScene);
  }, [onChange, actor, selectedScene]);

  const onTextChange = useCallback((
    name: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    set(actor, name, e.target.value);
    onDelayedChange?.(selectedScene);
  }, [onDelayedChange, actor, selectedScene]);

  return (
    <div className="p-3 w-full h-full overflow-x-hidden overflow-y-scroll">
      <Text size="1" className="text-slate">Actor</Text>
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
        { actor.name }
      </Heading>
      <Inset side="x"><Separator className="!w-full my-4" /></Inset>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Text className="block text-slate" size="1">Sprite</Text>
          <SpritesListField
            value={actor?.sprite ?? ''}
            onValueChange={onValueChange.bind(null, 'sprite')}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-2 flex-auto">
            <Text className="block text-slate" size="1">X</Text>
            <TextField.Root
              type="number"
              min={0}
              value={actor.x ?? 0}
              onChange={onTextChange.bind(null, 'x')}
            >
              <TextField.Slot side="right">
                tiles
              </TextField.Slot>
            </TextField.Root>
          </div>
          <div className="flex flex-col gap-2 flex-auto">
            <Text className="block text-slate" size="1">Y</Text>
            <TextField.Root
              type="number"
              min={0}
              value={actor.y ?? 0}
              onChange={onTextChange.bind(null, 'y')}
            >
              <TextField.Slot side="right">
                tiles
              </TextField.Slot>
            </TextField.Root>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-2 flex-auto">
            <Text className="block text-slate" size="1">Width</Text>
            <TextField.Root
              type="number"
              min={1}
              value={actor.width ?? 1}
              onChange={onTextChange.bind(null, 'width')}
            >
              <TextField.Slot side="right">
                tiles
              </TextField.Slot>
            </TextField.Root>
          </div>
          <div className="flex flex-col gap-2 flex-auto">
            <Text className="block text-slate" size="1">Height</Text>
            <TextField.Root
              type="number"
              min={1}
              value={actor.height ?? 2}
              onChange={onTextChange.bind(null, 'height')}
            >
              <TextField.Slot side="right">
                tiles
              </TextField.Slot>
            </TextField.Root>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Text className="block text-slate" size="1">Drawing priority</Text>
          <TextField.Root
            type="number"
            min={-32767}
            max={32767}
            value={actor.z ?? 2}
            onChange={onTextChange.bind(null, 'z')}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Text className="block text-slate" size="1">Direction</Text>
          <DirectionField
            value={actor.direction || 'down'}
            onValueChange={onValueChange.bind(null, 'direction')}
          />
        </div>
      </div>
      <Inset side="x"><Separator className="!w-full my-4" /></Inset>
      <div className="flex flex-col gap-4 pb-10">
        <Text className="block text-slate" size="1">Events</Text>
        <Inset className="!rounded-none !overflow-visible">
          <Tabs.Root defaultValue="interact">
            <Tabs.List size="1" className="px-1">
              <Tabs.Trigger value="interact">
                On Interact
              </Tabs.Trigger>
              <Tabs.Trigger value="init">
                On Init
              </Tabs.Trigger>
              <Tabs.Trigger value="update">
                <div className="flex items-center gap-1">
                  <Text>On Update</Text>
                  <Tooltip
                    content={
                      'These events will be executed every frame, use with ' +
                      'caution'
                    }
                  >
                    <InfoCircledIcon
                      width={12}
                      height={12}
                      className="[&_path]:fill-(--accent-9)"
                    />
                  </Tooltip>
                </div>
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="interact">
              <EventsField
                value={actor.events?.interact ?? []}
                onValueChange={onValueChange.bind(null, 'events.interact')}
              />
            </Tabs.Content>
            <Tabs.Content value="init">
              <EventsField
                value={actor.events?.init ?? []}
                onValueChange={onValueChange.bind(null, 'events.init')}
              />
            </Tabs.Content>
            <Tabs.Content value="update">
              <EventsField
                value={actor.events?.update ?? []}
                onValueChange={onValueChange.bind(null, 'events.update')}
              />
            </Tabs.Content>
          </Tabs.Root>
        </Inset>
      </div>
    </div>
  );
};

export default ActorForm;
