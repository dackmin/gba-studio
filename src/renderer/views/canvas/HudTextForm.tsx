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

import type { GameHud, GameHudText } from '../../../types';
import { useCanvas } from '../../services/hooks';
import EventValueField from '../../components/EventValueField';

// Sprites are limited on the GBA: one per character
export const HUD_TEXT_MAX_LENGTH = 30;

// A HUD text is a plain value or a variable
const EXCLUDED_TYPES = [
  'saved-game', 'player-attribute', 'direction', 'collision-side', 'scene',
  'actor',
];

export interface HudTextFormProps {
  item: GameHudText;
  onChange?: (hud?: GameHud) => void;
}

const HudTextForm = ({ item, onChange }: HudTextFormProps) => {
  const { selectedHud } = useCanvas();

  const onNameChange = useCallback((e: ChangeEvent<HTMLHeadingElement>) => {
    const name = (e.currentTarget.textContent || 'Untitled')
      .trim().slice(0, 32);

    if (name === item.name) {
      return;
    }

    set(item, 'name', name);
    onChange?.(selectedHud);
  }, [onChange, item, selectedHud]);

  const onNameKeyDown = (e: KeyboardEvent<HTMLHeadingElement>) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const onValueChange = useCallback((name: string, value: any) => {
    set(item, name, value);
    onChange?.(selectedHud);
  }, [onChange, item, selectedHud]);

  const onNumberChange = useCallback((
    name: string,
    min: number,
    max: number,
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const value = Math.round(Number(e.currentTarget.value));

    onValueChange(name, Math.min(max, Math.max(min, value || 0)));
  }, [onValueChange]);

  return (
    <ScrollArea scrollbars="vertical">
      <div className="p-3">
        <Text size="1" className="text-slate">HUD Text</Text>
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
              maxLength={HUD_TEXT_MAX_LENGTH}
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
                max={239}
                value={item.x ?? 0}
                onChange={onNumberChange.bind(null, 'x', 0, 239)}
              >
                <TextField.Slot side="right">px</TextField.Slot>
              </TextField.Root>
            </div>
            <div className="flex flex-col gap-2 flex-auto">
              <Text className="block text-slate" size="1">Y</Text>
              <TextField.Root
                type="number"
                min={0}
                max={159}
                value={item.y ?? 0}
                onChange={onNumberChange.bind(null, 'y', 0, 159)}
              >
                <TextField.Slot side="right">px</TextField.Slot>
              </TextField.Root>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Text className="block text-slate" size="1">Drawing priority</Text>
            <TextField.Root
              type="number"
              min={0}
              max={99}
              value={item.z ?? 0}
              onChange={onNumberChange.bind(null, 'z', 0, 99)}
            />
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default HudTextForm;
