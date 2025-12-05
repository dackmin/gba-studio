import {
  type KeyboardEvent,
  type MouseEvent,
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
import { classNames, exists } from '@junipero/react';
import { useSortable } from '@dnd-kit/sortable';

import type {
  DisableActorEvent,
  EnableActorEvent,
  ExecuteScriptEvent,
  GoToSceneEvent,
  IfEvent,
  MoveCameraToEvent,
  OnButtonPressEvent,
  PlayMusicEvent,
  PlaySoundEvent,
  SceneEvent,
  SetVariableEvent,
  ShowDialogEvent,
  ShowMenuEvent,
  WaitEvent,
  WaitForButtonEvent,
} from '../../../types';
import { getEventDefinition } from '../../services/events';
import { useApp } from '../../services/hooks';
import Switch from '../Switch';
import EventDuration from './EventDuration';
import EventGoToScene from './EventGoToScene';
import EventPlayMusic from './EventPlayMusic';
import EventButtons from './EventButtons';
import EventSetVariable from './EventSetVariable';
import EventShowDialog from './EventShowDialog';
import EventActor from './EventActor';
import EventIf from './EventIf';
import EventScript from './EventScript';
import EventPlaySound from './EventPlaySound';
import EventMoveCameraTo from './EventMoveCameraTo';
import EventShowMenu from './EventShowMenu';

export interface EventProps {
  event: SceneEvent;
  onValueChange?: (event: SceneEvent) => void;
  onDelete?: (event: SceneEvent) => void;
  onPrepend?: (event: SceneEvent, source?: SceneEvent) => void;
  onAppend?: (event: SceneEvent, source?: SceneEvent) => void;
}

const Event = ({
  event,
  onValueChange,
  onDelete,
  onPrepend,
  onAppend,
}: EventProps) => {
  const { clipboard, setClipboard } = useApp();
  const nameRef = useRef<HTMLDivElement>(null);
  const [opened, setOpened] = useState(event._collapsed ?? true);
  const [renaming, setRenaming] = useState(false);
  const {
    attributes,
    listeners,
    transform,
    transition,
    setNodeRef,
  } = useSortable({ id: event.id });

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

    setOpened(o => !o);
    event._collapsed = !opened;
    onValueChange?.(event);
  }, [opened, event, onValueChange]);

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

  return (
    <div
      className={classNames(
        'bg-(--gray-2) flex flex-col',
        {
          'bg-(--gray-5)': event.enabled === false,
        }
      )}
      ref={setNodeRef}
      style={{
        transform: `translate3d(${transform?.x || 0}px, ` +
          `${transform?.y || 0}px, 0)`,
        transition,
      }}
      { ...attributes }
      { ...!renaming ? listeners : {} }
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
            { opened ? <CaretDownIcon /> : <CaretRightIcon /> }
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
      { opened && (
        <div className="px-3 pb-3">
          <Switch value={event.type}>
            <Switch.Case value={['wait', 'fade-in', 'fade-out']}>
              <EventDuration
                event={event as WaitEvent}
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
            <Switch.Case value="stop-music">
              <Text className="text-xs text-slate text-center">
                This event has no properties
              </Text>
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
            <Switch.Case value="if">
              <EventIf
                event={event as IfEvent}
                onValueChange={onValueChange}
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
            <Switch.Case value="show-menu">
              <EventShowMenu
                event={event as ShowMenuEvent}
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
  );
};

export default Event;
