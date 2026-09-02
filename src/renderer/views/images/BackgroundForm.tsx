import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useState } from 'react';
import { Button, Heading, Inset, Separator, Text, TextField } from '@radix-ui/themes';
import { classNames, set } from '@junipero/react';

import { useApp, useSprite } from '../../services/hooks';
import { getImageSize } from '../../../helpers';

const BackgroundForm = () => {
  const { projectPath, onCanvasChange, ...appPayload } = useApp();
  const { selectedBackground } = useSprite();
  const [size, setSize] = useState([0, 0]);

  const updateSize = useCallback(async () => {
    try {
      const [width, height] = await getImageSize('project://' + selectedBackground?.path || '');

      setSize([width, height]);
    } catch {
      setSize([240, 160]);
    }
  }, [selectedBackground?.path]);

  useEffect(() => {
    updateSize();
  }, [updateSize]);

  const onNameChange = useCallback((e: ChangeEvent<HTMLHeadingElement>) => {
    if (!selectedBackground) {
      return;
    }

    const name = (e.currentTarget.textContent || 'Untitled')
      .trim().slice(0, 32);

    if (name === selectedBackground.name) {
      return;
    }

    set(selectedBackground, 'name', name);
    onCanvasChange?.({
      ...appPayload,
      backgrounds: appPayload.backgrounds?.map(bg => (
        bg._file === selectedBackground._file
          ? { ...bg, name }
          : bg
      )),
    });
  }, [onCanvasChange, selectedBackground, appPayload]);

  const onNameKeyDown = (e: KeyboardEvent<HTMLHeadingElement>) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const openParentFolder = useCallback(async () => {
    if (!selectedBackground) {
      return;
    }

    await window.electron.openParentFolder(projectPath, 'project://' + selectedBackground.path);
  }, [selectedBackground, projectPath]);

  if (!selectedBackground) {
    return null;
  }

  return (
    <div
      className={classNames(
        'p-3 w-full h-full',
        'flex flex-col gap-4 justify-between',
      )}
    >
      <div>
        <div>
          <Text size="1" className="text-slate">Background</Text>
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
            { selectedBackground.name }
          </Heading>
        </div>
        <Inset side="x"><Separator className="!w-full my-4" /></Inset>
        <div>
          <Text size="1" className="text-slate">File</Text>
          <div className="flex items-center gap-2">
            <Text className="flex-auto truncate">{ selectedBackground.path }</Text>
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
                value={size[0] ?? 0}
                disabled
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
                value={size[1] ?? 0}
                disabled
              >
                <TextField.Slot side="right">
                  px
                </TextField.Slot>
              </TextField.Root>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackgroundForm;
