import { type ChangeEvent, type KeyboardEvent, useCallback } from 'react';
import { classNames, set } from '@junipero/react';
import {
  Button,
  Heading,
  Inset,
  Separator,
  Text,
} from '@radix-ui/themes';

import { useApp, useAudio } from '../../services/hooks';

const SoundForm = () => {
  const { onCanvasChange, projectPath, ...appPayload } = useApp();
  const { selectedSound } = useAudio();

  const onNameChange = useCallback((e: ChangeEvent<HTMLHeadingElement>) => {
    if (!selectedSound) {
      return;
    }

    const name = (e.currentTarget.textContent || 'Untitled')
      .trim().slice(0, 32);

    if (name === selectedSound.name) {
      return;
    }

    set(selectedSound, 'name', name);
    onCanvasChange?.({
      ...appPayload,
      sounds: appPayload.sounds?.map(s => (
        s._file === selectedSound._file
          ? { ...s, name }
          : s
      )),
    });
    e.currentTarget.textContent = name;
  }, [onCanvasChange, selectedSound, appPayload]);

  const onNameKeyDown = (e: KeyboardEvent<HTMLHeadingElement>) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const openParentFolder = useCallback(async () => {
    if (!selectedSound) {
      return;
    }

    await window.electron.openParentFolder(projectPath, 'project://' + selectedSound.path);
  }, [selectedSound, projectPath]);

  if (!selectedSound) {
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
          <Text size="1" className="text-slate">Sprite</Text>
          <Heading
            contentEditable
            as="h2"
            size="4"
            className={classNames(
              'whitespace-nowrap overflow-scroll focus:outline-2 outline-(--accent-9) rounded-xs',
            )}
            onKeyDown={onNameKeyDown}
            onBlur={onNameChange}
            suppressContentEditableWarning
          >
            { selectedSound.name || 'Untitled' }
          </Heading>
        </div>
        <Inset side="x"><Separator className="!w-full my-4" /></Inset>
        <div>
          <Text size="1" className="text-slate">File</Text>
          <div className="flex items-center gap-2">
            <Text className="flex-auto truncate">{ selectedSound.path }</Text>
            <Button type="button" size="1" className="flex-none" onClick={openParentFolder}>
              Open
            </Button>
          </div>
        </div>
        <Inset side="x"><Separator className="!w-full my-4" /></Inset>
      </div>
    </div>
  );
};

export default SoundForm;
