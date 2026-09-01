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

const MusicForm = () => {
  const { onCanvasChange, projectPath, ...appPayload } = useApp();
  const { selectedMusic } = useAudio();

  const onNameChange = useCallback((e: ChangeEvent<HTMLHeadingElement>) => {
    if (!selectedMusic) {
      return;
    }

    const name = (e.currentTarget.textContent || 'Untitled')
      .trim().slice(0, 32);

    if (name === selectedMusic.name) {
      return;
    }

    set(selectedMusic, 'name', name);
    onCanvasChange?.({
      ...appPayload,
      music: appPayload.music?.map(s => (
        s._file === selectedMusic._file
          ? { ...s, name }
          : s
      )),
    });
    e.currentTarget.textContent = name;
  }, [onCanvasChange, selectedMusic, appPayload]);

  const onNameKeyDown = (e: KeyboardEvent<HTMLHeadingElement>) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const openParentFolder = useCallback(async () => {
    if (!selectedMusic) {
      return;
    }

    await window.electron.openParentFolder(projectPath, 'project://' + selectedMusic.path);
  }, [selectedMusic, projectPath]);

  if (!selectedMusic) {
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
          <Text size="1" className="text-slate">Music</Text>
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
            { selectedMusic.name || 'Untitled' }
          </Heading>
        </div>
        <Inset side="x"><Separator className="!w-full my-4" /></Inset>
        <div>
          <Text size="1" className="text-slate">File</Text>
          <div className="flex items-center gap-2">
            <Text className="flex-auto truncate">{ selectedMusic.path }</Text>
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

export default MusicForm;
