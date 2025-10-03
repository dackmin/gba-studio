import { type ComponentPropsWithoutRef, useCallback } from 'react';
import { classNames } from '@junipero/react';
import {
  ComponentBooleanIcon,
  CursorArrowIcon,
  HandIcon,
  PlusIcon,
} from '@radix-ui/react-icons';
import { Card, DropdownMenu, IconButton, Tooltip } from '@radix-ui/themes';
import { useHotkeys } from 'react-hotkeys-hook';

import { useCanvas } from '../../services/hooks';
import { AddSubtoolType, ToolType } from '../../../types';

export interface ToolbarProps extends ComponentPropsWithoutRef<'div'> {
  onSelectTool?: (tool: ToolType) => void;
}

const Toolbar = ({ className, onSelectTool, ...props }: ToolbarProps) => {
  const { tool } = useCanvas();

  const onAddClick = useCallback((_: AddSubtoolType) => {
    onSelectTool?.('add');
  }, [onSelectTool]);

  useHotkeys('v', () => onSelectTool?.('move'), [onSelectTool]);
  useHotkeys('a', () => onSelectTool?.('add'), [onSelectTool]);
  useHotkeys('c', () => onSelectTool?.('collisions'), [onSelectTool]);

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
        variant={tool === 'move' ? 'solid' : 'ghost'}
        onClick={onSelectTool?.bind(null, 'move')}
      >
        <Tooltip content="Select/Move">
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
        <Tooltip content="Pan">
          <HandIcon
            width={20}
            height={20}
            className="[&_path]:fill-onyx dark:[&_path]:fill-seashell"
          />
        </Tooltip>
      </IconButton>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <IconButton
            className="!m-0 !ml-2"
            size="2"
            variant={tool === 'add' ? 'solid' : 'ghost'}
          >
            <Tooltip content="Add">
              <PlusIcon
                width={20}
                height={20}
                className="[&_path]:fill-onyx dark:[&_path]:fill-seashell"
              />
            </Tooltip>
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content sideOffset={20} align="center">
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
        <Tooltip content="Collisions">
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
