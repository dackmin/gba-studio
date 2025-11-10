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

import type { AddSubToolType, ToolType } from '../../../types';
import { useCanvas } from '../../services/hooks';

export interface ToolbarProps extends ComponentPropsWithoutRef<'div'> {
  onSelectTool?: (tool: ToolType, subTool?: AddSubToolType) => void;
}

const Toolbar = ({ className, onSelectTool, ...props }: ToolbarProps) => {
  const [opened, setOpened] = useState(false);
  const { tool } = useCanvas();

  useHotkeys('v', () => {
    onSelectTool?.('default');
  }, [onSelectTool]);

  useHotkeys('a', () => {
    onSelectTool?.('add');
    setOpened(o => !o);
  }, []);

  useHotkeys('c', () => {
    onSelectTool?.('collisions');
  }, []);

  const onAddClick = useCallback((subTool: AddSubToolType) => {
    onSelectTool?.('add', subTool);
  }, [onSelectTool]);

  const onSelectTool_ = useCallback((tool: ToolType) => {
    onSelectTool?.(tool);
  }, [onSelectTool]);

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
        onClick={onSelectTool_?.bind(null, 'default',)}
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
            className={classNames(
              '[&_path]:fill-onyx dark:[&_path]:fill-seashell',
              { '[&_path]:!fill-seashell': tool === 'default' },
            )}
          />
        </Tooltip>
      </IconButton>
      <IconButton
        className="!m-0 !ml-2"
        size="2"
        variant={tool === 'pan' ? 'solid' : 'ghost'}
        onClick={onSelectTool_?.bind(null, 'pan')}
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
            className={classNames(
              '[&_path]:fill-onyx dark:[&_path]:fill-seashell',
              { '[&_path]:!fill-seashell': tool === 'pan' },
            )}
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
                className={classNames(
                  '[&_path]:fill-onyx dark:[&_path]:fill-seashell',
                  { '[&_path]:!fill-seashell': tool === 'add' },
                )}
              />
            </Tooltip>
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content side="top" sideOffset={20} align="center">
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
        onClick={onSelectTool_?.bind(null, 'collisions')}
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
            className={classNames(
              '[&_path]:fill-onyx dark:[&_path]:fill-seashell',
              { '[&_path]:!fill-seashell': tool === 'collisions' },
            )}
          />
        </Tooltip>
      </IconButton>
    </Card>
  );
};

export default Toolbar;
