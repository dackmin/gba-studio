import { type MouseEvent, useCallback, useMemo, useRef, useState } from 'react';
import {
  CaretDownIcon,
  CaretRightIcon,
  DotsVerticalIcon,
} from '@radix-ui/react-icons';
import { DropdownMenu, IconButton, Text } from '@radix-ui/themes';
import { classNames } from '@junipero/react';

import type {
  GoToSceneEvent,
  PlayMusicEvent,
  SceneEvent,
  SetVariableEvent,
  WaitEvent,
  WaitForButtonEvent,
} from '../../../types';
import { getEventDefinition } from '../../services/events';
import Switch from '../Switch';
import EventDuration from './EventDuration';
import EventGoToScene from './EventGoToScene';
import EventPlayMusic from './EventPlayMusic';
import EventButtons from './EventButtons';
import EventSetVariable from './EventSetVariable';

export interface EventProps {
  event: SceneEvent;
  onValueChange?: (event: SceneEvent) => void;
  onDelete?: (event: SceneEvent) => void;
  onPrepend?: (event: SceneEvent) => void;
  onAppend?: (event: SceneEvent) => void;
}

const Event = ({
  event,
  onValueChange,
  onDelete,
  onPrepend,
  onAppend,
}: EventProps) => {
  const nameRef = useRef<HTMLDivElement>(null);
  const [opened, setOpened] = useState(event._collapsed ?? true);
  const [renaming, setRenaming] = useState(false);

  const definition = useMemo(() => (
    getEventDefinition(event.type)
  ), [event.type]);

  const toggle = useCallback(() => {
    if (renaming) {
      return;
    }

    setOpened(o => !o);
    event._collapsed = !opened;
    onValueChange?.(event);
  }, [renaming, opened, event]);

  // const onRenameClick = () => {
  //   setRenaming(true);
  //   nameRef.current?.focus();
  // };

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

  return (
    <div className="bg-(--gray-2)">
      <a
        href="#"
        className="px-3 py-2 flex items-center justify-between"
        onClick={toggle}
      >
        <div className="flex items-center gap-2">
          { definition.icon && (
            <definition.icon className="[&_path]:fill-(--accent-9)" />
          ) }
          <div
            ref={nameRef}
            contentEditable={renaming}
            suppressContentEditableWarning
            className={classNames({
              [
              'whitespace-nowrap overflow-scroll focus:outline-2 ' +
                'outline-(--accent-9) rounded-xs'
              ]: renaming,
            })}
            onBlur={() => setRenaming(false)}
          >
            { definition.name }
          </div>
          { opened ? <CaretDownIcon /> : <CaretRightIcon /> }
        </div>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger onClick={e => e.stopPropagation()}>
            <IconButton variant="ghost" size="1">
              <DotsVerticalIcon />
            </IconButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            {/* <DropdownMenu.Item onClick={onRenameClick}>
              Rename event
            </DropdownMenu.Item>
            <DropdownMenu.Separator /> */}
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
      </a>
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
            <Switch.Case value="wait-for-button">
              <EventButtons
                event={event as WaitForButtonEvent}
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
