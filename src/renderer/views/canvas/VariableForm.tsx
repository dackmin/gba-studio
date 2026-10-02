import { type ChangeEvent, type KeyboardEvent, useCallback, useMemo } from 'react';
import { Badge, Card, Heading, Inset, ScrollArea, Separator, Text, TextField } from '@radix-ui/themes';
import { classNames, set } from '@junipero/react';

import type {
  EventValue,
  GameVariable,
  SceneEvent,
  SetVariableEvent,
  VariableUpdate,
} from '../../../types';
import { getEventsOfType } from '../../services/events';
import { useApp, useCanvas } from '../../services/hooks';

export interface VariableFormProps {
  variable: GameVariable;
  onChange?: (variable: GameVariable) => void;
}

const VariableForm = ({
  variable,
  onChange,
}: VariableFormProps) => {
  const { scenes, scripts, variables } = useApp();
  const { selectScene, selectScript, selectItem } = useCanvas();

  const collect = useCallback((
    events: SceneEvent[] | undefined,
    trigger: string,
    ctx: Pick<VariableUpdate, 'scene' | 'script' | 'owner'>,
  ) => {
    const res: VariableUpdate[] = [];

    for (const event of getEventsOfType<SetVariableEvent>('set-variable', events ?? [])) {
      if (event.name === variable.id || event.name === variable.name) {
        res.push({ event, trigger, ...ctx });
      }
    }

    return res;
  }, [variable]);

  const updates = useMemo(() => {
    const res: VariableUpdate[] = [];

    for (const scene of scenes) {
      res.push(...collect(scene.events, 'init', { scene }));

      for (const owner of [
        ...(scene.actors ?? []),
        ...(scene.sprites ?? []),
        ...(scene.map?.sensors ?? []),
      ]) {
        for (const [trigger, events] of Object.entries(owner.events ?? {})) {
          res.push(...collect(events, trigger, { scene, owner }));
        }
      }
    }

    for (const script of scripts) {
      res.push(...collect(script.events, 'script', { script }));
    }

    return res;
  }, [scenes, scripts, collect]);

  const formatValue = useCallback((value?: EventValue) => {
    if (typeof value !== 'object' || value === null) {
      return value === '' || value === undefined ? '""' : String(value);
    }

    switch (value.type) {
      case 'variable':
        return '$' + (
          variables.flatMap(v => v.values)
            .find(v => v.id === value.name || v.name === value.name)?.name ??
          value.name
        );
      case 'scene':
        return scenes.find(s => s.id === value.name)?.name ?? 'Scene';
      case 'player-attribute':
        return value.name === 'scene' ? 'Current scene' : `Player ${value.name}`;
      case 'direction':
        return value.name ?? 'down';
      case 'saved-game':
        return 'Has saved game';
      default:
        return 'Collision side';
    }
  }, [variables, scenes]);

  const formatBreadCrumb = useCallback((update: VariableUpdate) => {
    return ([] as string[])
      .concat(
        update.scene?.name || update.script?.name || 'Unknown'
      )
      .concat(
        update.owner?.name ? [update.owner.name + ` (${update.owner.type})`] : []
      )
      .concat(
        update.trigger ? ['On ' + update.trigger] : []
      )
      .join(' \u203a ');
  }, []);

  const onUpdateClick = useCallback((update: VariableUpdate) => {
    if (update.script) {
      selectScript?.(update.script);
    } else if (update.owner) {
      selectItem?.(update.scene, update.owner);
    } else {
      selectScene?.(update.scene);
    }
  }, [selectScene, selectScript, selectItem]);

  const onNameChange = useCallback((e: ChangeEvent<HTMLHeadingElement>) => {
    const name = (e.currentTarget.textContent || 'Untitled')
      .trim().slice(0, 32);

    if (name === variable.name) {
      return;
    }

    set(variable, 'name', name);
    onChange?.(variable);
  }, [onChange, variable]);

  const onNameKeyDown = (e: KeyboardEvent<HTMLHeadingElement>) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const onTextChange = useCallback((
    name: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    set(variable, name, e.currentTarget.value);
    onChange?.(variable);
  }, [onChange, variable]);

  return (
    <ScrollArea scrollbars="vertical">
      <div className="p-3">
        <Text size="1" className="text-slate">Variable</Text>
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
          { variable.name }
        </Heading>
        <Inset side="x"><Separator className="!w-full my-4" /></Inset>
        <div className="flex flex-col gap-2">
          <Text className="block text-slate" size="1">Default value</Text>
          <TextField.Root
            type="text"
            value={'' + (variable.defaultValue ?? '')}
            onChange={onTextChange.bind(null, 'defaultValue')}
          />
        </div>
        <Inset side="x"><Separator className="!w-full my-4" /></Inset>
        <div className="flex flex-col gap-2">
          <Text className="block text-slate" size="1">Updated in</Text>
          { updates.length ? (
            <div className="flex flex-col gap-1">
              { updates.map((update, i) => (
                <Card
                  key={`${i}-${update.event.id}`}
                  className="!cursor-pointer select-none"
                  onClick={onUpdateClick.bind(null, update)}
                >
                  <div className="flex flex-col items-start">
                    <Badge size="1" className="mb-1">
                      { update.scene ? 'Scene' : update.script ? 'Script' : 'Unknown' }
                    </Badge>
                    <Text size="1" className="text-slate truncate">
                      { formatBreadCrumb(update) }
                    </Text>
                    <Text size="2" className="truncate">
                      { formatValue(update.event.value) }
                    </Text>
                  </div>
                </Card>
              )) }
            </div>
          ) : (
            <Text size="1" className="text-slate">
              This variable is never updated
            </Text>
          ) }
        </div>
      </div>
    </ScrollArea>
  );
};

export default VariableForm;
