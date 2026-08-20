import { type ChangeEvent, useCallback, useMemo, useReducer } from 'react';
import { mockState, useTimeout } from '@junipero/react';
import {
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

import type { GameBackgroundFile, SpriteBitmap } from '../../../types';
import { useApp, useDelayedValue, useModal, useSprite } from '../../services/hooks';
import ChecklistItem from '../../components/ChecklistItem';
import Background from '../../components/Background';
import { toFileSlug } from '../../../helpers';

export interface BackgroundImportFormState {
  // Internal
  fetching: boolean;
  importing: boolean;
  preview?: SpriteBitmap;
  // Form
  path: string;
  name: string;
  width: number;
  height: number;
}

const BackgroundImportForm = () => {
  const { projectPath, projectBase, backgrounds, onCanvasChange, ...appPayload } = useApp();
  const { selectBackground } = useSprite();
  const { close } = useModal();
  const [state, dispatch] = useReducer(mockState<BackgroundImportFormState>, {
    fetching: false,
    importing: false,
    preview: undefined,
    // Form
    path: '',
    name: '',
    width: 0,
    height: 0,
  });

  useTimeout(() => {
    dispatch({ fetching: false });
  }, 400, [state.preview], { enabled: state.fetching === true });

  const onInputChange = useCallback((name: string, e: ChangeEvent<HTMLInputElement>) => {
    dispatch({ [name]: e.target.value });
  }, []);

  const onBrowse = useCallback(async () => {
    const file = await window.electron.browseFile({
      projectPath,
      filters: [
        { name: 'Images', extensions: ['bmp', 'png', 'jpg'] },
      ],
    });

    if (file) {
      dispatch({ fetching: true });

      const imageContent = await window.electron.loadImage(projectPath, file, 'background');

      const width = imageContent.width > imageContent.height
        ? imageContent.height : imageContent.width;
      const height = imageContent.height > imageContent.width
        ? imageContent.width : imageContent.height;

      dispatch({
        path: file,
        name: toFileSlug(file.split('/').pop()?.split('.').shift() ?? 'untitled'),
        preview: imageContent,
        width,
        height,
      });
    }
  }, [projectPath]);

  const canEdit = useCallback(() => (
    !state.fetching && !state.importing
  ), [state.fetching, state.importing]);

  const background = useDelayedValue<Partial<GameBackgroundFile>>({
    path: state.preview?.data,
    width: state.width,
    height: state.height,
  }, { delay: 400 });

  const checklist = useMemo(() => ([
    (state.preview?.width || 0) > 0 &&
      (state.preview?.height || 0) > 0 &&
      [256, 512].includes(state.preview?.width || 0) &&
      [256, 512].includes(state.preview?.height || 0),
  ]), [state.preview]);

  const canSubmit = useCallback(() => (
    canEdit() && !!state.path && checklist.every(c => c === true)
  ), [canEdit, state.path, checklist]);

  const onImport = useCallback(async () => {
    if (!canSubmit() || !state.preview) {
      return;
    }

    dispatch({ importing: true });

    const createdBackground = await window.electron.importBackground(
      projectPath,
      state.path,
      {
        type: 'background',
        width: state.preview.width,
        height: state.preview.height,
      },
    );

    onCanvasChange?.({
      ...appPayload,
      backgrounds: [
        createdBackground,
        ...backgrounds,
      ],
    });
    selectBackground?.(createdBackground);
    close();
  }, [
    canSubmit, close, onCanvasChange, selectBackground,
    projectPath, backgrounds, appPayload,
    state.path, state.preview,
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
        <Text size="1" className="text-slate">Background location</Text>
        <TextField.Root
          value={state.path}
          onChange={onInputChange.bind(null, 'path')}
          placeholder="/path/to/my-background.bmp"
          disabled={!canEdit()}
        >
          <TextField.Slot side="right">
            <Tooltip content="Browse" side="top">
              <IconButton size="1" variant="soft" onClick={onBrowse}>
                <MagnifyingGlassIcon />
              </IconButton>
            </Tooltip>
          </TextField.Slot>
        </TextField.Root>
        { state.path.startsWith(projectBase) && (
          <Callout.Root>
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text className="flex flex-col items-start gap-2">
              <Text>
                This background is already in your project folder, its configuration will be updated
                instead of creating a new one.
              </Text>
              <Button type="button" size="1" onClick={openParentFolder}>
                Open folder
              </Button>
            </Callout.Text>
          </Callout.Root>
        ) }
      </div>
      { state.path && (
        <>
          <div className="flex flex-col gap-2">
            <Text size="1" className="text-slate">Name</Text>
            <TextField.Root
              value={state.name}
              onChange={onInputChange.bind(null, 'name')}
              placeholder="My sprite name"
              disabled={!canEdit()}
            />
          </div>
        </>
      ) }
      { state.fetching ? (
        <div className="flex items-center justify-center">
          <Spinner />
        </div>
      ) : state.preview && background && (
        <div className="flex items-start gap-8">
          <div className="w-1/3! flex-none flex flex-col gap-2">
            <Text size="1" className="text-slate">Preview</Text>
            <Background
              background={background}
              className="border border-slate rounded"
            />
            <div className="flex flex-col gap-2">
              <Text size="1" className="text-slate">
                Original size: { state.preview.originalWidth }x{ state.preview.originalHeight }px
              </Text>
              <Text size="1" className="text-slate">
                Background size: { state.preview.width }x{ state.preview.height }px
              </Text>
              <Text size="1" className="text-slate">
                Type: { state.preview.mime }
              </Text>
            </div>
          </div>
          <div className="flex-2/3 flex flex-col gap-2 justify-start">
            <Text size="1" className="text-slate">Checklist</Text>
            <div className="flex flex-col gap-2">
              <ChecklistItem
                condition={checklist[0]}
              >
                <Text>Sizes are multiples of each other</Text>
              </ChecklistItem>
              <ChecklistItem warn condition={(state.preview?.tiles || 0) <= 1024}>
                <Text>Image has { state.preview?.tiles ?? 0 } tiles</Text>
                <Tooltip
                  content={(
                    <Text>
                      This is an approximation.
                      Butano/grit cut images into 8x8px tiles to reuse memory. To limit
                      the memory footprint, an image cannot have more than 1024 tiles.
                    </Text>
                  )}
                >
                  <InfoCircledIcon />
                </Tooltip>
              </ChecklistItem>
              <ChecklistItem warn condition={state.preview?.isResized !== true}>
                { state.preview?.isResized === true ? (
                  <Text>Image was resized to fit the screen</Text>
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

export default BackgroundImportForm;
