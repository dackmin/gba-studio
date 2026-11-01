import { type ChangeEvent, type KeyboardEvent, useCallback } from 'react';
import {
  Heading,
  Inset,
  ScrollArea,
  Separator,
  Text,
  TextField,
} from '@radix-ui/themes';
import { classNames, set } from '@junipero/react';

import type { GameText } from '../../../types';
import { TEXT_MAX_LENGTH } from '../../../commons';
import EventValueField, {
  EXCLUDE_ALL_EXCEPT_VALUE_AND_VARIABLES,
} from '../../components/EventValueField';
import ColorField from '../../components/ColorField';
import FontsListField from '../../components/FontsListField';

const EXCLUDED_TYPES = [
  'saved-game', 'player-attribute', 'direction', 'collision-side', 'scene',
  'actor',
];

export interface TextFormProps {
  item: GameText;
  // Texts of a HUD live on the screen, the ones of a scene anywhere on the map
  inHud?: boolean;
  onChange?: () => void;
}

const TextForm = ({ item, inHud = false, onChange }: TextFormProps) => {
  const onNameChange = useCallback((e: ChangeEvent<HTMLHeadingElement>) => {
    const name = (e.currentTarget.textContent || 'Untitled')
      .trim().slice(0, 32);

    if (name === item.name) {
      return;
    }

    set(item, 'name', name);
    onChange?.();
  }, [onChange, item]);

  const onNameKeyDown = (e: KeyboardEvent<HTMLHeadingElement>) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const onValueChange = useCallback((name: string, value: any) => {
    set(item, name, value);
    onChange?.();
  }, [onChange, item]);

  const onNumberChange = useCallback((
    name: string,
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const value = Math.round(Number(e.currentTarget.value));

    onValueChange(name, value);
  }, [onValueChange]);

  return (
    <ScrollArea scrollbars="vertical">
      <div className="p-3">
        <Text size="1" className="text-slate">Text</Text>
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
          { item.name }
        </Heading>
        <Inset side="x"><Separator className="!w-full my-4" /></Inset>
        <div className="flex flex-col gap-4 pb-10">
          <div className="flex flex-col gap-2">
            <Text className="block text-slate" size="1">Text</Text>
            <EventValueField
              type="text"
              maxLength={TEXT_MAX_LENGTH}
              excludeTypes={EXCLUDED_TYPES}
              value={item.text ?? ''}
              onValueChange={onValueChange.bind(null, 'text')}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-2 flex-auto">
              <Text className="block text-slate" size="1">X</Text>
              <TextField.Root
                type="number"
                min={0}
                value={item.x ?? 0}
                onChange={onNumberChange.bind(null, 'x')}
              >
                <TextField.Slot side="right">px</TextField.Slot>
              </TextField.Root>
            </div>
            <div className="flex flex-col gap-2 flex-auto">
              <Text className="block text-slate" size="1">Y</Text>
              <TextField.Root
                type="number"
                min={0}
                value={item.y ?? 0}
                onChange={onNumberChange.bind(null, 'y')}
              >
                <TextField.Slot side="right">px</TextField.Slot>
              </TextField.Root>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Text className="block text-slate" size="1">Drawing priority</Text>
            <EventValueField
              type="number"
              excludeTypes={EXCLUDE_ALL_EXCEPT_VALUE_AND_VARIABLES}
              value={item.z ?? (inHud ? 0 : 2)}
              onValueChange={onValueChange.bind(null, 'z')}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Text className="block text-slate" size="1">Color</Text>
            <ColorField
              type="text"
              value={item.color ?? ''}
              onValueChange={onValueChange.bind(null, 'color')}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Text className="block text-slate" size="1">Font</Text>
            <FontsListField
              value={item.font || ''}
              onValueChange={onValueChange.bind(null, 'font')}
            />
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default TextForm;
