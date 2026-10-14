import { type ChangeEvent, useCallback, useEffect, useMemo, useReducer } from 'react';
import { mockState, rgba2hex, useTimeout } from '@junipero/react';
import {
  Badge,
  Button,
  Callout,
  Dialog,
  IconButton,
  Spinner,
  Text,
  TextField,
  Tooltip,
} from '@radix-ui/themes';
import { InfoCircledIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';

import type { GameFontFile, SpriteBitmap } from '../../../types';
import { findFont, toFileSlug } from '../../../helpers';
import { useApp, useModal, useSprite } from '../../services/hooks';
import { hexToRgb } from '../../services/helpers';
import ChecklistItem from '../../components/ChecklistItem';
import ColorField from '../../components/ColorField';
import PixelText, { getTextWidth } from '../../components/PixelText';

export interface FontImportFormProps {
  path?: string;
}

export interface FontImportFormState {
  // Internal
  fetching: boolean;
  importing: boolean;
  preview?: SpriteBitmap;
  // Form
  path: string;
  name: string;
  fileName: string;
  transparentColor: string;
  width: number;
  height: number;
}

// A font is a vertical strip of 8px wide glyphs (ASCII 33-126), one glyph
// stacked below the other, like butano's sprite fonts.
const FIRST_CHAR = 33;
const LAST_CHAR = 126;
const GLYPHS_COUNT = LAST_CHAR - FIRST_CHAR + 1;
const SAMPLE_TEXT = 'The quick brown fox 0123';

const FontImportForm = ({
  path: initialPath,
}: FontImportFormProps) => {
  const {
    projectPath, projectBase, fonts, onCanvasChange, ...appPayload
  } = useApp();
  const { selectFont } = useSprite();
  const { close } = useModal();
  const [state, dispatch] = useReducer(mockState<FontImportFormState>, {
    fetching: !!initialPath,
    importing: false,
    preview: undefined,
    path: initialPath || '',
    name: '',
    fileName: '',
    transparentColor: '',
    width: 8,
    height: 8,
  });

  useTimeout(() => {
    dispatch({ fetching: false });
  }, 400, [state.preview, state.fetching], { enabled: state.fetching === true });

  const loadFile = useCallback(async (file: string, firstInit = true) => {
    dispatch({ fetching: true });

    const imageContent = await window.electron.loadImage(file, 'font');

    const glyphsHeight = imageContent.height % 8 === 0
      ? 8 : Math.round(imageContent.height / GLYPHS_COUNT);

    dispatch({
      path: file,
      ...firstInit && {
        fileName: (file.split('/').pop()?.split('.').shift() ?? 'untitled') + '.bmp',
        name: toFileSlug(file.split('/').pop()?.split('.').shift() ?? 'untitled'),
      },
      transparentColor: rgba2hex({
        r: imageContent.transparentColor?.[0] ?? 0,
        g: imageContent.transparentColor?.[1] ?? 0,
        b: imageContent.transparentColor?.[2] ?? 0,
      }),
      preview: imageContent,
      height: firstInit ? glyphsHeight : state.height,
    });
  }, [state.height]);

  useEffect(() => {
    if (initialPath) {
      loadFile(initialPath);
    }
    // eslint-disable-next-line react/exhaustive-deps
  }, []);

  const onInputChange = useCallback((name: string, e: ChangeEvent<HTMLInputElement>) => {
    dispatch({ [name]: e.target.value });
  }, []);

  const onValueChange = useCallback((name: string, value: string) => {
    dispatch({ [name]: value });
  }, []);

  const onBrowse = useCallback(async () => {
    const file = await window.electron.browseFile({
      projectPath,
      filters: [
        { name: 'Images', extensions: ['bmp', 'png', 'jpg'] },
      ],
    });

    if (file) {
      await loadFile(file);
    }
  }, [projectPath, loadFile]);

  const canEdit = useCallback(() => (
    !state.fetching && !state.importing
  ), [state.fetching, state.importing]);

  const glyphsCount = useMemo(() => (
    Math.floor((state.preview?.height ?? 0) / (Number(state.height) || 8))
  ), [state.preview?.height, state.height]);

  const checklist = useMemo(() => ([
    // The strip must be exactly 8px wide
    (state.preview?.width || 0) === 8,
    // All glyphs must have the same height, with no leftover pixels
    (state.preview?.height || 0) % (Number(state.height) || 8) === 0,
    // Butano supports at least 94 glyphs (ASCII 33-126)
    glyphsCount >= GLYPHS_COUNT,
  ]), [glyphsCount, state.preview?.width, state.preview?.height, state.height]);

  const transparencyColor = useMemo<[number, number, number]>(() => (
    state.transparentColor
      ? hexToRgb(state.transparentColor)
      : [0, 255, 0]
  ), [state.transparentColor]);

  const glyphHeight = useMemo(() => (
    Math.max(8, Number(state.height) || 8)
  ), [state.height]);

  const canSubmit = useCallback(() => (
    canEdit() && !!state.path && !!state.name &&
    checklist.every(c => c === true)
  ), [canEdit, state.path, state.name, checklist]);

  const onImport = useCallback(async () => {
    if (!canSubmit()) {
      return;
    }

    dispatch({ importing: true });

    const createdFont = await window.electron.importFont(
      projectPath,
      state.path,
      {
        type: 'font',
        name: state.name,
        width: 8,
        height: Number(state.height) || 8,
        transparentColor: state.transparentColor,
        _fileName: state.fileName,
      } satisfies Partial<GameFontFile>,
    );

    const exists = findFont(fonts, createdFont.id);

    onCanvasChange?.({
      ...appPayload,
      fonts: [
        ...!exists ? [createdFont] : [],
        ...fonts.map(f => f.id === createdFont.id ? createdFont : f),
      ],
    });
    selectFont?.(createdFont);
    close();
  }, [
    canSubmit, close, onCanvasChange, selectFont,
    projectPath, fonts, appPayload,
    state.path, state.height, state.name, state.transparentColor, state.fileName,
  ]);

  const openParentFolder = useCallback(async () => {
    if (!state.path) {
      return;
    }

    await window.electron.openParentFolder(projectPath, state.path);
  }, [state.path, projectPath]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Text size="1" className="text-slate">Font location</Text>
          <Badge size="1" variant="soft" color="blue">.bmp</Badge>
          <Badge size="1" variant="soft" color="blue">.png</Badge>
          <Badge size="1" variant="soft" color="blue">.jpg</Badge>
        </div>
        <TextField.Root
          value={state.path}
          onChange={onInputChange.bind(null, 'path')}
          placeholder="Select a font file"
          disabled={!canEdit()}
          readOnly
          className="cursor-default! [&>input]:cursor-default!"
        >
          <TextField.Slot side="right" className="cursor-default!">
            <Tooltip content="Browse" side="top">
              <IconButton size="1" variant="soft" onClick={onBrowse}>
                <MagnifyingGlassIcon />
              </IconButton>
            </Tooltip>
          </TextField.Slot>
        </TextField.Root>
        { state.path.startsWith(projectBase + '/graphics') && (
          <Callout.Root>
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text className="flex flex-col items-start gap-2">
              <Text>
                This font is already in your project folder, its configuration will be updated
                instead of creating a new one.
              </Text>
              <Button type="button" size="1" onClick={openParentFolder}>
                Open folder
              </Button>
            </Callout.Text>
          </Callout.Root>
        ) }
      </div>
      { state.path && state.preview && (
        <>
          <div className="flex flex-col gap-2">
            <Text size="1" className="text-slate">Font Name</Text>
            <TextField.Root
              value={state.name}
              onChange={onInputChange.bind(null, 'name')}
              placeholder="My font name"
              disabled={!canEdit()}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Text size="1" className="text-slate">File Name</Text>
            <TextField.Root
              value={state.fileName}
              onChange={onInputChange.bind(null, 'fileName')}
              placeholder="my-font-file.bmp"
              disabled={!canEdit()}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Text size="1" className="text-slate">Transparency color</Text>
            <ColorField
              value={state.transparentColor ?? ''}
              onValueChange={onValueChange.bind(null, 'transparentColor')}
              disabled={!canEdit()}
            />
          </div>
        </>
      ) }
      { state.fetching ? (
        <div className="flex items-center justify-center">
          <Spinner />
        </div>
      ) : state.preview && (
        <div className="flex items-start gap-8">
          <div className="w-1/3! flex-none flex flex-col gap-2">
            <Text size="1" className="text-slate">Preview</Text>
            <div
              className="border border-slate rounded overflow-x-auto p-2 bg-checker"
            >
              <PixelText
                text={SAMPLE_TEXT}
                fontUrl={state.preview.data}
                glyphHeight={glyphHeight}
                transparencyColor={transparencyColor}
                className="pixelated"
                style={{ width: getTextWidth(SAMPLE_TEXT) * 2 }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Text size="1" className="text-slate">
                Image size: { state.preview.originalWidth }x
                { state.preview.originalHeight }px
              </Text>
              <Text size="1" className="text-slate">
                Font size: { state.width }x{ state.height }px
              </Text>
              <Text size="1" className="text-slate">
                Type: { state.preview.mime }
              </Text>
            </div>
          </div>
          <div className="flex-2/3 flex flex-col gap-2 justify-start">
            <Text size="1" className="text-slate">Checklist</Text>
            <div className="flex flex-col gap-2">
              <ChecklistItem condition={checklist[0]}>
                <Text>Font is 8px wide</Text>
              </ChecklistItem>
              <ChecklistItem condition={checklist[1]}>
                <Text>Height is a multiple of the glyph height</Text>
              </ChecklistItem>
              <ChecklistItem condition={checklist[2]}>
                <Text>
                  { glyphsCount || 0 } glyphs detected (at least { GLYPHS_COUNT }
                  , ASCII { FIRST_CHAR }-{ LAST_CHAR })
                </Text>
              </ChecklistItem>
              <ChecklistItem warn condition={state.preview?.isResized !== true}>
                { state.preview?.isResized === true ? (
                  <Text>Image was resized to fit the grid</Text>
                ) : (
                  <Text>No resizing needed</Text>
                ) }
              </ChecklistItem>
            </div>
          </div>
        </div>
      ) }

      <div className="flex items-center gap-2 justify-end mt-4">
        <Dialog.Close>
          <Button
            variant="soft"
            color="gray"
            className="mr-2"
            type="button"
            disabled={!canEdit()}
          >
            <Text>Cancel</Text>
          </Button>
        </Dialog.Close>
        <Button
          variant="solid"
          disabled={!canSubmit()}
          onClick={onImport}
        >
          { state.importing && <Spinner /> }
          <Text>Import</Text>
        </Button>
      </div>
    </div>
  );
};

export default FontImportForm;
