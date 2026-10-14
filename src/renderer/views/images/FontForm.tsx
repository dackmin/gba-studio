import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useState } from 'react';
import { Button, Heading, Inset, Separator, Text, TextField } from '@radix-ui/themes';
import { classNames, set } from '@junipero/react';

import { useApp, useSprite } from '../../services/hooks';
import { getAssetUrl, getImageSize } from '../../../helpers';
import { hexToRgb } from '../../services/helpers';
import PixelText, { getTextWidth } from '../../components/PixelText';

const SAMPLE_TEXT = 'The quick brown fox 0123';

const FontForm = () => {
  const { projectPath, onCanvasChange, ...appPayload } = useApp();
  const { selectedFont } = useSprite();
  const [size, setSize] = useState([0, 0]);

  const updateSize = useCallback(async () => {
    try {
      const [width, height] = await getImageSize(getAssetUrl(selectedFont));

      setSize([width, height]);
    } catch {
      setSize([8, 0]);
    }
  }, [selectedFont]);

  useEffect(() => {
    updateSize();
  }, [updateSize]);

  const onNameChange = useCallback((e: ChangeEvent<HTMLHeadingElement>) => {
    if (!selectedFont) {
      return;
    }

    const name = (e.currentTarget.textContent || 'Untitled')
      .trim().slice(0, 32);

    if (name === selectedFont.name) {
      return;
    }

    set(selectedFont, 'name', name);
    onCanvasChange?.({
      ...appPayload,
      fonts: appPayload.fonts?.map(f => (
        f._file === selectedFont._file
          ? { ...f, name }
          : f
      )),
    });
  }, [onCanvasChange, selectedFont, appPayload]);

  const onNameKeyDown = (e: KeyboardEvent<HTMLHeadingElement>) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const openParentFolder = useCallback(async () => {
    if (!selectedFont) {
      return;
    }

    await window.electron.openParentFolder(projectPath, 'project://' + selectedFont.path);
  }, [selectedFont, projectPath]);

  if (!selectedFont) {
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
          <Text size="1" className="text-slate">Font</Text>
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
            { selectedFont.name }
          </Heading>
        </div>
        <Inset side="x"><Separator className="!w-full my-4" /></Inset>
        <div>
          <Text size="1" className="text-slate">File</Text>
          <div className="flex items-center gap-2">
            <Text className="flex-auto truncate">{ selectedFont.path }</Text>
            <Button type="button" size="1" className="flex-none" onClick={openParentFolder}>
              Open
            </Button>
          </div>
        </div>
        <Inset side="x"><Separator className="!w-full my-4" /></Inset>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 flex-auto">
              <Text className="block text-slate" size="1">Image Width</Text>
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
              <Text className="block text-slate" size="1">Image Height</Text>
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
          <div className="flex flex-col gap-2">
            <Text className="block text-slate" size="1">Glyphs</Text>
            <Text size="2">
              { Math.max(0, Math.floor((size[1] || 0) / (selectedFont.height || 8))) }
            </Text>
          </div>
          <div className="flex flex-col gap-2">
            <Text className="block text-slate" size="1">Transparency Color</Text>
            <div className="flex items-center gap-2">
              <div
                className="rounded-sm border-1 border-(--gray-5) h-6 w-6"
                style={{ backgroundColor: selectedFont?.transparentColor ?? '#000' }}
              />
              <Text className="text-sm">{ selectedFont?.transparentColor ?? '#000' }</Text>
            </div>
          </div>
        </div>
        <Inset side="x"><Separator className="!w-full my-4" /></Inset>
        <div className="flex flex-col gap-2">
          <Text className="block text-slate" size="1">Preview</Text>
          <div className="overflow-x-auto border border-slate rounded p-2 bg-checker">
            <PixelText
              text={SAMPLE_TEXT}
              color="#000"
              fontUrl={getAssetUrl(selectedFont)}
              glyphHeight={selectedFont.height || 8}
              transparencyColor={
                selectedFont.transparentColor
                  ? hexToRgb(selectedFont.transparentColor)
                  : [0, 255, 0]
              }
              className="pixelated"
              style={{ width: getTextWidth(SAMPLE_TEXT) * 2 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FontForm;
