import { type ChangeEvent, type KeyboardEvent, useCallback } from 'react';
import { classNames, set } from '@junipero/react';
import {
  Button,
  Heading,
  Inset,
  ScrollArea,
  Separator,
  Text,
  TextField,
} from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';

import type { SpriteAnimation } from '../../../types';
import { useApp, useSprite } from '../../services/hooks';
import AnimationsListItem from './AnimationsListItem';

const SpriteForm = () => {
  const { onCanvasChange, projectPath, ...appPayload } = useApp();
  const {
    selectedSprite,
    onAnimationsChange,
    onAddAnimation,
    onRemoveAnimation,
  } = useSprite();

  const onAnimationChange = useCallback((animation: SpriteAnimation) => {
    if (!selectedSprite) {
      return;
    }

    onAnimationsChange?.({
      ...selectedSprite!,
      animations: selectedSprite!.animations?.map(a => (
        a.id === animation.id ? animation : a
      )),
    });
  }, [selectedSprite, onAnimationsChange]);

  const onTextChange = useCallback((field: string, e: ChangeEvent<HTMLInputElement>) => {
    if (!selectedSprite) {
      return;
    }

    set(selectedSprite, field, e.currentTarget.value);
    onCanvasChange?.({
      ...appPayload,
      sprites: appPayload.sprites.map(s => (
        s._file === selectedSprite._file ? selectedSprite : s
      )),
    });
  }, [selectedSprite, onCanvasChange, appPayload]);

  const onNameChange = useCallback((e: ChangeEvent<HTMLHeadingElement>) => {
    if (!selectedSprite) {
      return;
    }

    const name = (e.currentTarget.textContent || 'Untitled')
      .trim().slice(0, 32);

    if (name === selectedSprite.name) {
      return;
    }

    set(selectedSprite, 'name', name);
    onCanvasChange?.({
      ...appPayload,
      sprites: appPayload.sprites?.map(s => (
        s._file === selectedSprite._file
          ? { ...s, name }
          : s
      )),
    });
    e.currentTarget.textContent = name;
  }, [onCanvasChange, selectedSprite, appPayload]);

  const onNameKeyDown = (e: KeyboardEvent<HTMLHeadingElement>) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const openParentFolder = useCallback(async () => {
    if (!selectedSprite) {
      return;
    }

    await window.electron.openParentFolder(projectPath, 'project://' + selectedSprite.path);
  }, [selectedSprite, projectPath]);

  if (!selectedSprite) {
    return null;
  }

  return (
    <ScrollArea scrollbars="vertical">
      <div
        className={classNames(
          'p-3 w-full h-full',
          'flex flex-col gap-4 justify-between',
        )}
      >
        <div>
          <div>
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
              { selectedSprite.name || 'Untitled' }
            </Heading>
          </div>
          <Inset side="x"><Separator className="!w-full my-4" /></Inset>
          <div>
            <Text size="1" className="text-slate">File</Text>
            <div className="flex items-center gap-2">
              <Text className="flex-auto truncate">{ selectedSprite.path }</Text>
              <Button type="button" size="1" className="flex-none" onClick={openParentFolder}>
                Open
              </Button>
            </div>
          </div>
          <Inset side="x"><Separator className="!w-full my-4" /></Inset>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2 flex-auto">
                <Text className="block text-slate" size="1">Width</Text>
                <TextField.Root
                  type="number"
                  min={0}
                  value={selectedSprite?.width ?? 0}
                  onChange={onTextChange.bind(null, 'width')}
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
                  onChange={onTextChange.bind(null, 'height')}
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
                  { selectedSprite?.animations?.map(anim => (
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
    </ScrollArea>
  );
};

export default SpriteForm;
