import { useCallback, useMemo } from 'react';
import { classNames } from '@junipero/react';
import {
  Button,
  Heading,
  Inset,
  Separator,
  Text,
  TextField,
} from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import { v4 as uuid } from 'uuid';

import type { SpriteAnimation } from '../../../types';
import { useApp, useSprite } from '../../services/hooks';
import { getGraphicName } from '../../../helpers';
import AnimationsListItem from './AnimationsListItem';

const SpriteForm = () => {
  const { animations } = useApp();
  const { selectedSprite, selectAnimation, onAnimationsChange } = useSprite();

  const spriteAnimations = useMemo(() => (
    animations.find(a => a._sprite_file === selectedSprite?._file)
  ), [animations, selectedSprite]);

  const spriteName = useMemo(() => (
    getGraphicName(selectedSprite?._file)
  ), [selectedSprite]);

  const onAddAnimation = useCallback(() => {
    const newAnimation: SpriteAnimation = {
      type: 'animation',
      name: 'New Animation',
      animationType: 'fixed',
      states: {},
      // Internals
      id: uuid(),
    };

    if (!spriteAnimations) {
      onAnimationsChange?.({
        type: 'animations',
        animations: [newAnimation],
        // Internals
        id: uuid(),
        _sprite_file: selectedSprite?._file,
        _file: `${spriteName}.animations.json`,
      });
    } else {
      spriteAnimations.animations.push(newAnimation);
      onAnimationsChange?.(spriteAnimations);
    }

    selectAnimation?.(newAnimation);
  }, [
    selectedSprite, spriteAnimations, spriteName,
    onAnimationsChange, selectAnimation,
  ]);

  const onRemoveAnimation = useCallback((animation: SpriteAnimation) => {
    if (!spriteAnimations) {
      return;
    }

    spriteAnimations.animations = spriteAnimations.animations.filter(a => (
      a.id !== animation.id
    ));
    onAnimationsChange?.(spriteAnimations);
  }, [spriteAnimations, onAnimationsChange]);

  const onAnimationChange = useCallback((animation: SpriteAnimation) => {
    onAnimationsChange?.({
      ...spriteAnimations!,
      animations: spriteAnimations!.animations.map(a => (
        a.id === animation.id ? animation : a
      )),
    });
  }, [spriteAnimations, onAnimationsChange]);

  return (
    <div
      className={classNames(
        'p-3 w-full h-full',
        'flex flex-col gap-4 justify-between',
      )}
    >
      <div className="">
        <Text size="1" className="text-slate">Sprite</Text>
        <Heading
          as="h2"
          size="4"
          className={classNames(
            'whitespace-nowrap overflow-scroll focus:outline-2',
            'outline-(--accent-9) rounded-xs',
          )}
        >
          { spriteName }
        </Heading>
        <Inset side="x"><Separator className="!w-full my-4" /></Inset>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 flex-auto">
              <Text className="block text-slate" size="1">Width</Text>
              <TextField.Root
                type="number"
                min={0}
                value={selectedSprite?.width ?? 0}
                // onValueChange={onValueChange_.bind(null, 'width')}
              >
                <TextField.Slot side="right">
                  px
                </TextField.Slot>
              </TextField.Root>
            </div>
            <div className="flex flex-col gap-2 flex-auto">
              <Text className="block text-slate" size="1">Height</Text>
              <TextField.Root
                type="number"
                min={0}
                value={selectedSprite?.height ?? 0}
                // onValueChange={onValueChange.bind(null, 'height')}
              >
                <TextField.Slot side="right">
                  px
                </TextField.Slot>
              </TextField.Root>
            </div>
          </div>
        </div>
        <Inset side="x"><Separator className="!w-full my-4" /></Inset>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Text className="block text-slate" size="1">Animations</Text>
            <Inset side="x" className="!rounded-none !overflow-visible">
              <div className="flex flex-col gap-[1px]">
                { spriteAnimations?.animations.map(anim => (
                  <AnimationsListItem
                    key={anim.id}
                    animation={anim}
                    onValueChange={onAnimationChange}
                    onDelete={onRemoveAnimation}
                  />
                )) }
              </div>
            </Inset>
          </div>

          <Button className="block !w-full" onClick={onAddAnimation}>
            <PlusIcon />
            <Text>Add Animation</Text>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SpriteForm;
