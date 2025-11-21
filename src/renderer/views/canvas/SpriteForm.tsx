import { ChangeEvent, KeyboardEvent, useCallback } from 'react';
import { Heading, Inset, Separator, Text, TextField } from '@radix-ui/themes';
import { classNames, set } from '@junipero/react';

import type { GameScene, GameSprite } from '../../../types';
import { useCanvas, useDelayedCallback } from '../../services/hooks';
import SpritesListField from '../../components/SpritesListField';
import EventValueField from '../../components/EventValueField';

export interface SpriteFormProps {
  sprite: GameSprite;
  onChange?: (scene?: GameScene) => void;
}

const SpriteForm = ({
  sprite,
  onChange,
}: SpriteFormProps) => {
  const { selectedScene } = useCanvas();
  const onDelayedChange = useDelayedCallback(onChange, 300);

  const onNameChange = useCallback((e: ChangeEvent<HTMLHeadingElement>) => {
    const name = (e.currentTarget.textContent || 'Untitled')
      .trim().slice(0, 32);

    if (name === sprite.name) {
      return;
    }

    set(sprite, 'name', name);
    onChange?.(selectedScene);
  }, [onChange, sprite, selectedScene]);

  const onNameKeyDown = (e: KeyboardEvent<HTMLHeadingElement>) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const onValueChange = useCallback((name: string, value: any) => {
    set(sprite, name, value);
    onChange?.(selectedScene);
  }, [onChange, sprite, selectedScene]);

  const onTextChange = useCallback((
    name: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    set(sprite, name, e.target.value);
    onDelayedChange?.(selectedScene);
  }, [onDelayedChange, sprite, selectedScene]);

  return (
    <div className="p-3 w-full h-full overflow-x-hidden overflow-y-scroll">
      <Text size="1" className="text-slate">Sprite</Text>
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
      <div className="flex flex-col gap-4">
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
            <EventValueField
              type="number"
              min={0}
              value={sprite.x ?? 0}
              onValueChange={onValueChange.bind(null, 'x')}
            >
              <TextField.Slot side="right">
                tiles
              </TextField.Slot>
            </EventValueField>
          </div>
          <div className="flex flex-col gap-2 flex-auto">
            <Text className="block text-slate" size="1">Y</Text>
            <EventValueField
              type="number"
              min={0}
              value={sprite.y ?? 0}
              onValueChange={onValueChange.bind(null, 'y')}
            >
              <TextField.Slot side="right">
                tiles
              </TextField.Slot>
            </EventValueField>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-2 flex-auto">
            <Text className="block text-slate" size="1">Width</Text>
            <EventValueField
              type="number"
              min={1}
              value={sprite.width ?? 1}
              onValueChange={onValueChange.bind(null, 'width')}
            >
              <TextField.Slot side="right">
                tiles
              </TextField.Slot>
            </EventValueField>
          </div>
          <div className="flex flex-col gap-2 flex-auto">
            <Text className="block text-slate" size="1">Height</Text>
            <EventValueField
              type="number"
              min={1}
              value={sprite.height ?? 2}
              onValueChange={onValueChange.bind(null, 'height')}
            >
              <TextField.Slot side="right">
                tiles
              </TextField.Slot>
            </EventValueField>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Text className="block text-slate" size="1">Drawing priority</Text>
          <EventValueField
            type="number"
            min={-32767}
            max={32767}
            value={sprite.z ?? 2}
            onValueChange={onValueChange.bind(null, 'z')}
          />
        </div>
      </div>
    </div>
  );
};

export default SpriteForm;
