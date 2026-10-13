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

import type { GameHud, GameHudSprite } from '../../../types';
import { useCanvas } from '../../services/hooks';
import SpritesListField from '../../components/SpritesListField';

export interface HudSpriteFormProps {
  sprite: GameHudSprite;
  onChange?: (hud?: GameHud) => void;
}

const HudSpriteForm = ({ sprite, onChange }: HudSpriteFormProps) => {
  const { selectedHud } = useCanvas();

  const onNameChange = useCallback((e: ChangeEvent<HTMLHeadingElement>) => {
    const name = (e.currentTarget.textContent || 'Untitled')
      .trim().slice(0, 32);

    if (name === sprite.name) {
      return;
    }

    set(sprite, 'name', name);
    onChange?.(selectedHud);
  }, [onChange, sprite, selectedHud]);

  const onNameKeyDown = (e: KeyboardEvent<HTMLHeadingElement>) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const onValueChange = useCallback((name: string, value: any) => {
    set(sprite, name, value);
    onChange?.(selectedHud);
  }, [onChange, sprite, selectedHud]);

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
        <Text size="1" className="text-slate">HUD Sprite</Text>
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
          { sprite.name }
        </Heading>
        <Inset side="x"><Separator className="!w-full my-4" /></Inset>
        <div className="flex flex-col gap-4 pb-10">
          <div className="flex flex-col gap-2">
            <Text className="block text-slate" size="1">Sprite image</Text>
            <SpritesListField
              value={sprite.sprite ?? ''}
              onValueChange={onValueChange.bind(null, 'sprite')}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-2 flex-auto">
              <Text className="block text-slate" size="1">X</Text>
              <TextField.Root
                type="number"
                min={0}
                max={239}
                value={sprite.x ?? 0}
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
                value={sprite.y ?? 0}
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
              value={sprite.z ?? 0}
              onChange={onNumberChange.bind(null, 'z', 0, 99)}
            />
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default HudSpriteForm;
