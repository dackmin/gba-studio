import { type ChangeEvent, type KeyboardEvent, useCallback } from 'react';
import {
  Heading,
  Inset,
  ScrollArea,
  Separator,
  Switch,
  Tabs,
  Text,
  TextField,
  Tooltip,
} from '@radix-ui/themes';
import { classNames, set } from '@junipero/react';
import { InfoCircledIcon } from '@radix-ui/react-icons';

import type { GameActor, GameScene } from '../../../types';
import { SceneFormContext } from '../../services/contexts';
import { useCanvas, useDelayedCallback } from '../../services/hooks';
import EventsField from '../../components/EventsField';
import SpritesListField from '../../components/SpritesListField';
import DirectionField from '../../components/DirectionField';
import EventValueField, {
  EXCLUDE_ALL_EXCEPT_VALUE_AND_VARIABLES,
} from '../../components/EventValueField';
import CollisionGroupField from '../../components/CollisionGroupField';
import Collapsible from '../../components/Collapsible';

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

  const getContext = useCallback(() => ({
    scene: selectedScene,
  }), [selectedScene]);

  return (
    <SceneFormContext value={getContext()}>
      <ScrollArea scrollbars="vertical">
        <div className="p-3">
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
            <div className="flex flex-col gap-2">
              <Text className="block text-slate" size="1">Drawing priority</Text>
              <EventValueField
                type="number"
                min={-32767}
                max={32767}
                value={actor.z ?? 2}
                onValueChange={onValueChange.bind(null, 'z')}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Text className="block text-slate" size="1">Direction</Text>
              <DirectionField
                value={actor.direction || 'down'}
                exclude={[
                  'towards_player', 'from_player', 'player', 'up_left', 'up_right',
                  'down_left', 'down_right', 'all',
                ]}
                onValueChange={onValueChange.bind(null, 'direction')}
              />
            </div>
            <Collapsible.Root>
              <Collapsible.Trigger className="px-0! py-0! text-sm! text-slate">
                Advanced
              </Collapsible.Trigger>
              <Collapsible.Content className="mt-4! flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Text className="block text-slate" size="1">Reaction</Text>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!!actor.disableDirectionOnInteract}
                      onCheckedChange={
                        onValueChange.bind(null, 'disableDirectionOnInteract')
                      }
                    />
                    <Text size="1">Don&apos;t turn to face player on interact</Text>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Text className="block text-slate" size="1">Collision group</Text>
                  <CollisionGroupField
                    value={actor.collisionGroup}
                    sceneType={selectedScene?.sceneType}
                    onValueChange={onValueChange.bind(null, 'collisionGroup')}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Text className="block text-slate" size="1">Pass through</Text>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!!actor.passThrough}
                      onCheckedChange={onValueChange.bind(null, 'passThrough')}
                    />
                    <Text size="1">Player can pass through</Text>
                  </div>
                </div>
                { selectedScene?.sceneType === 'side-scroller' && (
                  <>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1">
                        <Text className="block text-slate" size="1">Bounce Height</Text>
                        <Tooltip
                          content={
                            'Pushes the player away by this many pixels when touching this ' +
                            'actor (use a big value for springs-like behavior).'
                          }
                        >
                          <InfoCircledIcon
                            width={12}
                            height={12}
                            className="[&_path]:fill-(--accent-9)"
                          />
                        </Tooltip>
                      </div>
                      <EventValueField
                        type="number"
                        min={0}
                        max={255}
                        excludeTypes={EXCLUDE_ALL_EXCEPT_VALUE_AND_VARIABLES}
                        value={actor.bounce ?? 0}
                        onValueChange={onValueChange.bind(null, 'bounce')}
                      >
                        <TextField.Slot side="right">
                          px
                        </TextField.Slot>
                      </EventValueField>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Text className="block text-slate" size="1">Bounce Direction</Text>
                      <DirectionField
                        value={actor.bounceDirection ?? 'all'}
                        exclude={[
                          'towards_player', 'from_player', 'player',
                          'up_left', 'up_right', 'down_left', 'down_right',
                        ]}
                        onValueChange={onValueChange.bind(null, 'bounceDirection')}
                      />
                    </div>
                  </>
                ) }
              </Collapsible.Content>
            </Collapsible.Root>
          </div>
          <Inset side="x"><Separator className="!w-full my-4" /></Inset>
          <div className="flex flex-col gap-4 pb-10">
            <Text className="block text-slate" size="1">Events</Text>
            <Inset className="!rounded-none !overflow-visible">
              <Tabs.Root defaultValue="interact">
                <Tabs.List size="1" className="px-1">
                  <Tabs.Trigger value="init">
                    On Init
                  </Tabs.Trigger>
                  <Tabs.Trigger value="interact">
                    On Interact
                  </Tabs.Trigger>
                  <Tabs.Trigger value="update">
                    <div className="flex items-center gap-1">
                      <Text>On Update</Text>
                      <Tooltip
                        content="These events will be executed on every frame, use with caution"
                      >
                        <InfoCircledIcon
                          width={12}
                          height={12}
                          className="[&_path]:fill-(--accent-9)"
                        />
                      </Tooltip>
                    </div>
                  </Tabs.Trigger>
                  <Tabs.Trigger value="collide">
                    On Collide
                  </Tabs.Trigger>
                  <Tabs.Trigger value="hit">
                    <div className="flex items-center gap-1">
                      <Text>On Hit</Text>
                      <Tooltip
                        content="Executed when a Melee Attack event hits this actor"
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

                <Tabs.Content value="init">
                  <EventsField
                    key={actor.id}
                    value={actor.events?.init ?? []}
                    onValueChange={onValueChange.bind(null, 'events.init')}
                  />
                </Tabs.Content>
                <Tabs.Content value="interact">
                  <EventsField
                    key={actor.id}
                    value={actor.events?.interact ?? []}
                    onValueChange={onValueChange.bind(null, 'events.interact')}
                  />
                </Tabs.Content>
                <Tabs.Content value="update">
                  <EventsField
                    key={actor.id}
                    value={actor.events?.update ?? []}
                    onValueChange={onValueChange.bind(null, 'events.update')}
                  />
                </Tabs.Content>
                <Tabs.Content value="collide">
                  <EventsField
                    key={actor.id}
                    value={actor.events?.collide ?? []}
                    onValueChange={onValueChange.bind(null, 'events.collide')}
                  />
                </Tabs.Content>
                <Tabs.Content value="hit">
                  <EventsField
                    key={actor.id}
                    value={actor.events?.hit ?? []}
                    onValueChange={onValueChange.bind(null, 'events.hit')}
                  />
                </Tabs.Content>
              </Tabs.Root>
            </Inset>
          </div>
        </div>
      </ScrollArea>
    </SceneFormContext>
  );
};

export default ActorForm;
