import {
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useMemo,
} from 'react';
import { classNames } from '@junipero/react';
import {
  CodeIcon,
  PlusCircledIcon,
  StackIcon,
} from '@radix-ui/react-icons';
import { IconButton, InsetProps, Text, ContextMenu } from '@radix-ui/themes';
import { v4 as uuid } from 'uuid';

import type { GameScript, GameVariables } from '../../../types';
import { useApp, useCanvas } from '../../services/hooks';
import Collapsible from '../../components/Collapsible';

export interface LeftSidebarProps extends InsetProps {}

const LeftSidebar = ({
  className,
}: LeftSidebarProps) => {
  const {
    scenes,
    scripts,
    variables,
  } = useApp();
  const {
    selectedScene,
    selectedItem,
    selectScene,
    selectScript,
    onVariablesChange,
    onScriptsChange,
  } = useCanvas();

  const allVariables = useMemo(() => (
    variables.flatMap(v => Object.keys(v.values || {}))
  ), [variables]);

  const onVariableNameKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const onVariableNameChange = useCallback((
    registry: GameVariables,
    oldName: string,
    e: ChangeEvent<HTMLDivElement>
  ) => {
    const name = e.currentTarget.textContent
      .trim().slice(0, 32);

    if (name === oldName) {
      return;
    }

    if (!name) {
      // Remove variable
      const { [oldName]: _, ...rest } = registry.values;
      onVariablesChange?.({
        ...registry,
        values: rest,
      });

      return;
    }

    onVariablesChange?.({
      ...registry,
      values: Object
        .fromEntries(Object.entries(registry.values).map(([k, v]) => (
          k === oldName ? [name, v] : [k, v]
        ))),
    });
  }, [onVariablesChange]);

  const onAddVariable = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (!variables.length) {
      variables.push({
        _file: 'variables.json',
        type: 'variables',
        id: uuid(),
        values: {},
      });
    }

    const latestRegistry = variables[variables.length - 1];
    const name = 'Variable_' +
      Object.keys(latestRegistry?.values || {}).length;
    onVariablesChange?.({
      ...latestRegistry,
      values: {
        ...latestRegistry?.values,
        [name]: 0,
      },
    });

    // Focus the new variable
    setTimeout(() => {
      const varEl = document.querySelector(
        `[data-variable="${name}"] [contenteditable]`
      ) as HTMLDivElement | undefined;

      if (varEl) {
        varEl.focus();

        const range = document.createRange();
        range.selectNodeContents(varEl);

        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 10);
  }, [variables, onVariablesChange]);

  const onAddScript = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    const name = `Script ${scripts.length + 1}`;
    const script: GameScript = {
      _file: `script_${scripts.length + 1}.json`,
      id: uuid(),
      type: 'script',
      name,
      events: [],
    };

    onScriptsChange?.([...scripts, script]);
  }, [scripts, onScriptsChange]);

  const onRemoveScript = useCallback((script: GameScript) => {
    onScriptsChange?.(
      scripts.filter(s => s !== script)
    );
  }, [scripts, onScriptsChange]);

  return (
    <div className={classNames('flex flex-col !w-full gap-px', className)}>
      <Collapsible.Root className="!w-full">
        <Collapsible.Trigger>
          <Text>Scenes</Text>
        </Collapsible.Trigger>
        <Collapsible.Content>
          { scenes?.length <= 0 ? (
            <Text
              size="1"
              className="block text-center text-slate pb-3"
            >
              No scenes
            </Text>
          ) : scenes.map(scene => (
            <a
              key={scene._file}
              href="#"
              className={classNames(
                'flex items-center gap-2 px-3 py-1',
                { 'bg-(--accent-9)': selectedScene === scene },
              )}
              onClick={selectScene?.bind(null, scene)}
            >
              <StackIcon
                className={classNames(
                  '[&_path]:fill-(--accent-9)',
                  { '[&_path]:fill-seashell': selectedScene === scene },
                )}
              />
              <Text>{ scene.name }</Text>
            </a>
          )) }
        </Collapsible.Content>
      </Collapsible.Root>

      <Collapsible.Root>
        <Collapsible.Trigger>
          <div className="flex items-center justify-between w-full">
            <Text>Scripts</Text>
            <IconButton
              variant="ghost"
              radius="full"
              onClick={onAddScript}
            >
              <PlusCircledIcon
                width={16}
                height={16}
              />
            </IconButton>
          </div>
        </Collapsible.Trigger>
        <Collapsible.Content>
          { scripts.length <= 0 ? (
            <Text
              size="1"
              className="block text-center text-slate pb-3"
            >
              No scripts
            </Text>
          ) : scripts.map(script => (
            <ContextMenu.Root key={script._file}>
              <ContextMenu.Trigger>
                <a
                  href="#"
                  className={classNames(
                    'flex items-center gap-2 px-3 py-1',
                    { 'bg-(--accent-9)': selectedItem === script },
                  )}
                  onClick={selectScript?.bind(null, script)}
                >
                  <CodeIcon
                    className={classNames(
                      '[&_path]:fill-(--accent-9)',
                      { '[&_path]:fill-seashell': selectedItem === script },
                    )}
                  />
                  <Text>{ script.name }</Text>
                </a>
              </ContextMenu.Trigger>
              <ContextMenu.Content>
                <ContextMenu.Item
                  shortcut={window.electron.isDarwin ? '⌦' : 'Del'}
                  onClick={onRemoveScript.bind(null, script)}
                >
                  Delete
                </ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu.Root>
          )) }
        </Collapsible.Content>
      </Collapsible.Root>

      <Collapsible.Root className="w-full">
        <Collapsible.Trigger>
          <div className="flex items-center justify-between w-full">
            <Text>Variables</Text>
            <IconButton
              variant="ghost"
              radius="full"
              onClick={onAddVariable}
            >
              <PlusCircledIcon
                width={16}
                height={16}
              />
            </IconButton>
          </div>
        </Collapsible.Trigger>
        <Collapsible.Content className="flex flex-col w-full">
          { allVariables?.length <= 0 ? (
            <Text
              size="1"
              className="block text-center text-slate pb-3"
            >
              No variables
            </Text>
          ) : variables.map(registry => (
            Object.keys(registry?.values || {}).map(v => (
              <div
                key={v}
                className="px-3 flex items-center w-full gap-2 py-1 flex-nowrap"
                data-variable={v}
              >
                <Text className="text-(--accent-9) cursor-default">
                  $
                </Text>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  className={classNames(
                    'whitespace-nowrap flex-auto w-full overflow-x-scroll',
                    'editable',
                    'outline-(--accent-9) rounded-xs focus:outline-2',
                  )}
                  onKeyDown={onVariableNameKeyDown}
                  onBlur={onVariableNameChange.bind(null, registry, v)}
                >
                  { v }
                </div>
              </div>
            ))
          )) }
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  );
};

export default LeftSidebar;
