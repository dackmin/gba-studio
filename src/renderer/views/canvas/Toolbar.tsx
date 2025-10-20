import { type ComponentPropsWithoutRef, useCallback, useState } from 'react';
import { classNames } from '@junipero/react';
import {
  ComponentBooleanIcon,
  CursorArrowIcon,
  HandIcon,
  PlusIcon,
} from '@radix-ui/react-icons';
import {
  Card,
  DropdownMenu,
  IconButton,
  Kbd,
  Text,
  Tooltip,
} from '@radix-ui/themes';
import { useHotkeys } from 'react-hotkeys-hook';

import type { AddSubtoolType, ToolType } from '../../../types';
import { useCanvas } from '../../services/hooks';

export interface ToolbarProps extends ComponentPropsWithoutRef<'div'> {
  onSelectTool?: (tool: ToolType) => void;
}

const Toolbar = ({ className, onSelectTool, ...props }: ToolbarProps) => {
  const [opened, setOpened] = useState(false);
  const { tool } = useCanvas();

  const onAddClick = useCallback((_: AddSubtoolType) => {
    onSelectTool?.('add');
  }, [onSelectTool]);

  useHotkeys('v', () => {
    onSelectTool?.('default');
  }, [onSelectTool], { useKey: true });

  useHotkeys('a', () => {
    onSelectTool?.('add');
    setOpened(o => !o);
  }, [], { useKey: true });

  useHotkeys('c', () => {
    onSelectTool?.('collisions');
  }, [], { useKey: true });

  return (
    <Card
      size="2"
      className={classNames(
        'flex items-center !bg-seashell dark:!bg-onyx !p-3',
        className
      )}
      { ...props }
    >
      <IconButton
        className="!m-0"
        size="2"
        variant={tool === 'default' ? 'solid' : 'ghost'}
        onClick={onSelectTool?.bind(null, 'default')}
      >
        <Tooltip
          content={(
            <span className="flex items-center gap-2">
              <Text>Select/Move</Text>
              <Kbd>V</Kbd>
            </span>
          )}
        >
          <CursorArrowIcon
            width={20}
            height={20}
            className="[&_path]:fill-onyx dark:[&_path]:fill-seashell"
          />
        </Tooltip>
      </IconButton>
      <IconButton
        className="!m-0 !ml-2"
        size="2"
        variant={tool === 'pan' ? 'solid' : 'ghost'}
        onClick={onSelectTool?.bind(null, 'pan')}
      >
        <Tooltip
          content={(
            <span className="flex items-center gap-2">
              <Text>Pan</Text>
              <Kbd>Space (hold)</Kbd>
            </span>
          )}
        >
          <HandIcon
            width={20}
            height={20}
            className="[&_path]:fill-onyx dark:[&_path]:fill-seashell"
          />
        </Tooltip>
      </IconButton>
      <DropdownMenu.Root open={opened} onOpenChange={setOpened}>
        <DropdownMenu.Trigger>
          <IconButton
            className="!m-0 !ml-2"
            size="2"
            variant={tool === 'add' ? 'solid' : 'ghost'}
          >
            <Tooltip
              content={(
                <span className="flex items-center gap-2">
                  <Text>Add</Text>
                  <Kbd>A</Kbd>
                </span>
              )}
            >
              <PlusIcon
                width={20}
                height={20}
                className="[&_path]:fill-onyx dark:[&_path]:fill-seashell"
              />
            </Tooltip>
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content sideOffset={20} align="center">
          <DropdownMenu.Item onClick={onAddClick.bind(null, 'scene')}>
            Scene
          </DropdownMenu.Item>
          <DropdownMenu.Item onClick={onAddClick.bind(null, 'sensor')}>
            Sensor
          </DropdownMenu.Item>
          <DropdownMenu.Item onClick={onAddClick.bind(null, 'actor')}>
            Actor
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      <IconButton
        className="!m-0 !ml-auto"
        size="2"
        variant={tool === 'collisions' ? 'solid' : 'ghost'}
        onClick={onSelectTool?.bind(null, 'collisions')}
      >
        <Tooltip
          content={(
            <span className="flex items-center gap-2">
              <Text>Collisions</Text>
              <Kbd>C</Kbd>
            </span>
          )}
        >
          <ComponentBooleanIcon
            width={20}
            height={20}
            className="[&_path]:fill-onyx dark:[&_path]:fill-seashell"
          />
        </Tooltip>
      </IconButton>
    </Card>
  );
};

export default Toolbar;
