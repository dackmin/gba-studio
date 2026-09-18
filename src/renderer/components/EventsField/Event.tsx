import {
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  CaretDownIcon,
  CaretRightIcon,
  DotsVerticalIcon,
} from '@radix-ui/react-icons';
import { DropdownMenu, IconButton, Text } from '@radix-ui/themes';
import {
  type DraggingPositionType,
  Draggable,
  Droppable,
  classNames,
  exists,
} from '@junipero/react';

import type {
  DisableActorEvent,
  DisableSpriteEvent,
  EnableActorEvent,
  EnableSpriteEvent,
  ExecuteScriptEvent,
  FollowActorEvent,
  FollowPlayerEvent,
  GoToSceneEvent,
  IfEvent,
  MoveActorToEvent,
  MoveCameraToEvent,
  MovePlayerToEvent,
  OnButtonPressEvent,
  ParallelEventsEvent,
  PlayMusicEvent,
  PlaySoundEvent,
  SceneEvent,
  SetActorDirectionEvent,
  SetActorPositionEvent,
  SetBackgroundEvent,
  SetPaletteEffectEvent,
  SetPlayerDirectionEvent,
  SetPlayerPositionEvent,
  SetVariableEvent,
  ShowDialogEvent,
  ShowMenuEvent,
  WaitEvent,
  WaitForButtonEvent,
  WaveEffectEvent,
} from '../../../types';
import { ALL_EVENT_TYPES, getEventDefinition } from '../../services/events';
import { useApp, useDraggable, useLocalData } from '../../services/hooks';
import Switch from '../Switch';
import EventDuration from './EventDuration';
import EventGoToScene from './EventGoToScene';
import EventPlayMusic from './EventPlayMusic';
import EventButtons from './EventButtons';
import EventSetVariable from './EventSetVariable';
import EventShowDialog from './EventShowDialog';
import EventActor from './EventActor';
import EventSprite from './EventSprite';
import EventIf from './EventIf';
import EventScript from './EventScript';
import EventPlaySound from './EventPlaySound';
import EventMoveCameraTo from './EventMoveCameraTo';
import EventFollowActor from './EventFollowActor';
import EventFollowPlayer from './EventFollowPlayer';
import EventShowMenu from './EventShowMenu';
import EventMoveActorTo from './EventMoveActorTo';
import EventMovePlayerTo from './EventMovePlayerTo';
import EventSetActorDirection from './EventSetActorDirection';
import EventSetActorPosition from './EventSetActorPosition';
import EventSetPlayerDirection from './EventSetPlayerDirection';
import EventSetPlayerPosition from './EventSetPlayerPosition';
import EventSetBackground from './EventSetBackground';
import EventParallel from './EventParallel';
import EventSetPaletteEffect from './EventSetPaletteEffect';
import EventWaveEffect from './EventWaveEffect';

export interface EventProps {
  event: SceneEvent;
  zone?: string;
  index: number;
  onValueChange?: (event: SceneEvent) => void;
  onDelete?: (event: SceneEvent) => void;
  onPrepend?: (event: SceneEvent, source?: SceneEvent) => void;
  onAppend?: (event: SceneEvent, source?: SceneEvent) => void;
  onDrop?: (
    container: SceneEvent[] | undefined,
    target: SceneEvent,
    data: SceneEvent,
    position: DraggingPositionType,
    e: DragEvent<HTMLDivElement>,
  ) => void;
}

const Event = ({
  event,
  onValueChange,
  onDelete,
  onPrepend,
  onAppend,
  onDrop,
}: EventProps) => {
  const { clipboard, setClipboard } = useApp();
  const { data, setData } = useDraggable<SceneEvent>();
  const { collapse, isCollapsed } = useLocalData();
  const nameRef = useRef<HTMLDivElement>(null);
  const fieldsRef = useRef<HTMLDivElement>(null);
  const dragOriginRef = useRef<EventTarget | null>(null);
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    if (!renaming) {
      return;
    }

    nameRef.current?.focus();
  }, [renaming]);

  const definition = useMemo(() => (
    getEventDefinition(event.type)
  ), [event.type]);

  const onToggleCollapsibleClick = useCallback((
    e: MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    collapse(event.id);
  }, [collapse, event]);

  const onToggleEventClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    event.enabled = !(event.enabled ?? true);
    onValueChange?.(event);
  }, [event, onValueChange]);

  const onDeleteClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    onDelete?.(event);
  }, [onDelete, event]);

  const onPrependClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    onPrepend?.(event);
  }, [onPrepend, event]);

  const onAppendClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    onAppend?.(event);
  }, [onAppend, event]);

  const onCopyClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    setClipboard(event);
  }, [event, setClipboard]);

  const onPasteBeforeClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    onPrepend?.(event, clipboard as SceneEvent);
  }, [onPrepend, event, clipboard]);

  const onPasteAfterClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    onAppend?.(event, clipboard as SceneEvent);
  }, [onAppend, event, clipboard]);

  const onRename = useCallback(() => {
    if (!renaming) {
      return;
    }

    const newName = nameRef.current?.innerText.trim();

    if (newName !== definition.name) {
      event._name = newName;
      onValueChange?.(event);
    }

    setRenaming(false);
  }, [renaming, definition.name, event, onValueChange]);

  const onNameKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const onNameClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (e.detail !== 2) {
      return;
    }

    setRenaming(true);
  }, []);

  const onRenameClick = () => {
    setTimeout(() => {
      setRenaming(true);
    }, 200);
  };

  const onDragStart = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.stopPropagation();

    // the drag source is always this row, regardless of where inside it the
    // gesture began - veto it here if that origin was the fields body (any
    // form control's own padding included, not just its focusable input) or
    // the name label while it's being renamed
    const origin = dragOriginRef.current as Node | null;

    if (
      fieldsRef.current?.contains(origin) ||
      (renaming && nameRef.current?.contains(origin))
    ) {
      e.preventDefault();

      return;
    }

    setData(event);
  }, [setData, event, renaming]);

  const onDragEnd = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setData(undefined);
  }, [setData]);

  return (
    <Droppable onDrop={onDrop?.bind(null, undefined, event)}>
      <Draggable
        data={event}
        // Prevents dragging the parent when event is inside a container (if, parallel-events, ...)
        onDrag={e => e.stopPropagation()}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onPointerDownCapture={(e: PointerEvent<HTMLDivElement>) => {
          dragOriginRef.current = e.target;
        }}
      >
        <div
          className={classNames(
            'group relative bg-(--gray-2) flex flex-col',

            // Drag start
            'dragging:border-2 dragging:border-(--accent-9) dragging:rounded-xl',

            // Dragged (e.g the element that stays behind)
            'dragged:not-has-[.dragging]:opacity-5',

            // Drop to top
            'drop-top:before:content-[""] drop-top:before:absolute drop-top:before:block',
            'drop-top:before:bg-(--accent-9)',
            'drop-top:before:h-[2px] drop-top:before:w-full',
            'drop-top:before:-top-px drop-top:before:left-0',
            'dragged:drag-top:before:hidden!',
            // If has containers, hide the drop indicators
            'has-[.drag-enter]:drop-top:before:hidden!',

            // Drop to bottom
            'drop-bottom:after:content-[""] drop-bottom:after:absolute drop-bottom:after:block',
            'drop-bottom:after:bg-(--accent-9)',
            'drop-bottom:after:h-[2px] drop-bottom:after:w-full',
            'drop-bottom:after:-bottom-px drop-bottom:after:left-0',
            'dragged:drag-bottom:after:hidden!',
            // If has containers, hide the drop indicators
            'has-[.drag-enter]:drop-bottom:after:hidden!',
            {
              'bg-(--gray-5)': event.enabled === false,
              ['drop-top:before:hidden drop-top:after:hidden']:
                !ALL_EVENT_TYPES.includes(data?.type || ''),
            }
          )}
        >
          <div
            className="px-3 py-2 w-full flex items-center flex-nowrap"
          >
            <div
              className={classNames(
                'flex items-center flex-nowrap justify-start flex-auto gap-2',
              )}
            >
              { definition.icon && (
                <div className="flex-none">
                  <definition.icon className="[&_path]:fill-(--accent-9)" />
                </div>
              ) }
              <div
                ref={nameRef}
                className={classNames(
                  'whitespace-nowrap',
                  {
                    [
                    'overflow-scroll focus:outline-2 flex-auto' +
                      'outline-(--accent-9) rounded-xs'
                    ]: renaming,
                    'overflow-hidden text-ellipsis flex-none': !renaming,
                    'line-through': event.enabled === false && !renaming,
                  }
                )}
                contentEditable={renaming}
                suppressContentEditableWarning
                onClick={onNameClick}
                onKeyDown={onNameKeyDown}
                onBlur={onRename}
              >
                { event._name || definition.name }
              </div>
              <IconButton
                variant="ghost"
                size="1"
                className="flex-none"
                onClick={onToggleCollapsibleClick}
              >
                { !isCollapsed(event.id) ? <CaretDownIcon /> : <CaretRightIcon /> }
              </IconButton>
            </div>
            <div className="flex-none flex items-center gap-1">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger onClick={e => e.stopPropagation()}>
                  <IconButton variant="ghost" size="1">
                    <DotsVerticalIcon />
                  </IconButton>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">
                  <DropdownMenu.Item onClick={onRenameClick}>
                    Rename event
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onClick={onToggleEventClick}>
                    { event.enabled !== false ? 'Disable event' : 'Enable event' }
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item onClick={onCopyClick}>
                    Copy event
                  </DropdownMenu.Item>
                  { exists(clipboard) && (
                    <>
                      <DropdownMenu.Item onClick={onPasteBeforeClick}>
                        Paste event before
                      </DropdownMenu.Item>
                      <DropdownMenu.Item onClick={onPasteAfterClick}>
                        Paste event after
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator />
                    </>
                  ) }
                  <DropdownMenu.Item onClick={onPrependClick}>
                    Add event above
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onClick={onAppendClick}>
                    Add event below
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item onClick={onDeleteClick}>
                    Delete event
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </div>
          </div>
          { !isCollapsed(event.id) && (
            <div className="px-3 pb-3" ref={fieldsRef}>
              <Switch value={event.type}>
                <Switch.Case value={['wait', 'fade-in', 'fade-out']}>
                  <EventDuration
                    event={event as WaitEvent}
                    onValueChange={onValueChange}
                  />
                </Switch.Case>
                <Switch.Case value="set-palette-effect">
                  <EventSetPaletteEffect
                    event={event as SetPaletteEffectEvent}
                    onValueChange={onValueChange}
                  />
                </Switch.Case>
                <Switch.Case value="wave-effect">
                  <EventWaveEffect
                    event={event as WaveEffectEvent}
                    onValueChange={onValueChange}
                  />
                </Switch.Case>
                <Switch.Case value="go-to-scene">
                  <EventGoToScene
                    event={event as GoToSceneEvent}
                    onValueChange={onValueChange}
                  />
                </Switch.Case>
                <Switch.Case value="play-music">
                  <EventPlayMusic
                    event={event as PlayMusicEvent}
                    onValueChange={onValueChange}
                  />
                </Switch.Case>
                <Switch.Case value={['wait-for-button', 'on-button-press']}>
                  <EventButtons
                    event={event as WaitForButtonEvent | OnButtonPressEvent}
                    onValueChange={onValueChange}
                  />
                </Switch.Case>
                <Switch.Case value="set-variable">
                  <EventSetVariable
                    event={event as SetVariableEvent}
                    onValueChange={onValueChange}
                  />
                </Switch.Case>
                <Switch.Case value="show-dialog">
                  <EventShowDialog
                    event={event as ShowDialogEvent}
                    onValueChange={onValueChange}
                  />
                </Switch.Case>
                <Switch.Case value={['enable-actor', 'disable-actor']}>
                  <EventActor
                    event={event as EnableActorEvent | DisableActorEvent}
                    onValueChange={onValueChange}
                  />
                </Switch.Case>
                <Switch.Case value={['enable-sprite', 'disable-sprite']}>
                  <EventSprite
                    event={event as EnableSpriteEvent | DisableSpriteEvent}
                    onValueChange={onValueChange}
                  />
                </Switch.Case>
                <Switch.Case value="if">
                  <EventIf
                    event={event as IfEvent}
                    onValueChange={onValueChange}
                    onDrop={onDrop}
                  />
                </Switch.Case>
                <Switch.Case value="execute-script">
                  <EventScript
                    event={event as ExecuteScriptEvent}
                    onValueChange={onValueChange}
                  />
                </Switch.Case>
                <Switch.Case value="play-sound">
                  <EventPlaySound
                    event={event as PlaySoundEvent}
                    onValueChange={onValueChange}
                  />
                </Switch.Case>
                <Switch.Case value="move-camera-to">
                  <EventMoveCameraTo
                    event={event as MoveCameraToEvent}
                    onValueChange={onValueChange}
                  />
                </Switch.Case>
                <Switch.Case value="follow-actor">
                  <EventFollowActor
                    event={event as FollowActorEvent}
                    onValueChange={onValueChange}
                  />
                </Switch.Case>
                <Switch.Case value="follow-player">
                  <EventFollowPlayer
                    event={event as FollowPlayerEvent}
                    onValueChange={onValueChange}
                  />
                </Switch.Case>
                <Switch.Case value="move-actor-to">
                  <EventMoveActorTo
                    event={event as MoveActorToEvent}
                    onValueChange={onValueChange}
                  />
                </Switch.Case>
                <Switch.Case value="move-player-to">
                  <EventMovePlayerTo
                    event={event as MovePlayerToEvent}
                    onValueChange={onValueChange}
                  />
                </Switch.Case>
                <Switch.Case value="set-actor-position">
                  <EventSetActorPosition
                    event={event as SetActorPositionEvent}
                    onValueChange={onValueChange}
                  />
                </Switch.Case>
                <Switch.Case value="set-player-position">
                  <EventSetPlayerPosition
                    event={event as SetPlayerPositionEvent}
                    onValueChange={onValueChange}
                  />
                </Switch.Case>
                <Switch.Case value="show-menu">
                  <EventShowMenu
                    event={event as ShowMenuEvent}
                    onValueChange={onValueChange}
                  />
                </Switch.Case>
                <Switch.Case value="parallel-events">
                  <EventParallel
                    event={event as ParallelEventsEvent}
                    onValueChange={onValueChange}
                    onDrop={onDrop}
                  />
                </Switch.Case>
                <Switch.Case
                  value={[
                    'stop-music', 'disable-input', 'enable-input', 'freeze-camera',
                    'disable-player', 'enable-player',
                  ]}
                >
                  <Text className="text-xs text-slate text-center">
                    This event has no properties
                  </Text>
                </Switch.Case>
                <Switch.Case value="set-actor-direction">
                  <EventSetActorDirection
                    event={event as SetActorDirectionEvent}
                    onValueChange={onValueChange}
                  />
                </Switch.Case>
                <Switch.Case value="set-player-direction">
                  <EventSetPlayerDirection
                    event={event as SetPlayerDirectionEvent}
                    onValueChange={onValueChange}
                  />
                </Switch.Case>
                <Switch.Case value="set-background">
                  <EventSetBackground
                    event={event as SetBackgroundEvent}
                    onValueChange={onValueChange}
                  />
                </Switch.Case>
                <Switch.Case default>
                  <pre>{ JSON.stringify(event, null, 2) }</pre>
                </Switch.Case>
              </Switch>
            </div>
          ) }
        </div>
      </Draggable>
    </Droppable>
  );
};

export default Event;
