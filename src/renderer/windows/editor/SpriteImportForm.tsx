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

import { useApp, useDelayedValue, useModal, useSprite } from '../../services/hooks';
import Sprite from '../../components/Sprite';
import { GameSpriteFile, SpriteBitmap } from '../../../types';
import ChecklistItem from '../../components/ChecklistItem';
import { getTilesCount } from '../../../helpers';

export interface SpriteImportFormState {
  // Internal
  fetching: boolean;
  importing: boolean;
  preview?: SpriteBitmap;
  // Form
  path: string;
  width: number;
  height: number;
}

const SpriteImportForm = () => {
  const { projectPath, projectBase, sprites, onCanvasChange, ...appPayload } = useApp();
  const { selectSprite } = useSprite();
  const { close } = useModal();
  const [state, dispatch] = useReducer(mockState<SpriteImportFormState>, {
    fetching: false,
    importing: false,
    preview: undefined,
    // Form
    path: '',
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

      const imageContent = await window.electron.loadImage(projectPath, file);

      const width = imageContent.width > imageContent.height
        ? imageContent.height : imageContent.width;
      const height = imageContent.height > imageContent.width
        ? imageContent.width : imageContent.height;

      dispatch({
        path: file,
        preview: imageContent,
        width,
        height,
      });
    }
  }, [projectPath]);

  const canEdit = useCallback(() => (
    !state.fetching && !state.importing
  ), [state.fetching, state.importing]);

  const sprite = useDelayedValue<Partial<GameSpriteFile>>({
    path: state.preview?.data,
    width: state.width,
    height: state.height,
  }, { delay: 400 });

  const tilesCount = useDelayedValue<number>(getTilesCount(
    state.preview?.width ?? 0,
    state.preview?.height ?? 0,
    state.width,
    state.height,
  ), { delay: 400 });

  const checklist = useMemo(() => ([
    (state.preview?.width || 0) > 0 && (state.preview?.height || 0) > 0 &&
      (state.preview!.width > state.preview!.height
        ? state.preview!.width % state.preview!.height === 0
        : state.preview!.height % state.preview!.width === 0),
    tilesCount > 0,
    state.preview?.isCompressed !== true,
    state?.preview?.isIndexed === true,
  ]), [tilesCount, state.preview]);

  const canSubmit = useCallback(() => (
    canEdit() && !!state.path && !!state.width && !!state.height && checklist.every(c => c === true)
  ), [canEdit, state.path, state.width, state.height, checklist]);

  const onImport = useCallback(async () => {
    if (!canSubmit()) {
      return;
    }

    dispatch({ importing: true });

    const createdSprite = await window.electron.importSprite(
      projectPath,
      state.path,
      {
        type: 'sprite',
        width: state.width,
        height: state.height,
      },
    );

    onCanvasChange?.({
      ...appPayload,
      sprites: [
        createdSprite,
        ...sprites,
      ],
    });
    selectSprite?.(createdSprite);
    close();
  }, [
    canSubmit, close, onCanvasChange, selectSprite,
    projectPath, sprites, appPayload,
    state.path, state.width, state.height,
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Sprite location</Text>
        <TextField.Root
          value={state.path}
          onChange={onInputChange.bind(null, 'path')}
          placeholder="/path/to/my-sprite.bmp"
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
            <Callout.Text>
              This sprite is already in your project folder, its configuration will be updated
              instead of creating a new one.
            </Callout.Text>
          </Callout.Root>
        ) }
      </div>
      { state.path && (
        <div className="flex items-center gap-2">
          <div className="flex-auto flex flex-col gap-2">
            <Text size="1" className="text-slate">Frame width</Text>
            <TextField.Root
              value={state.width ?? 0}
              type="number"
              onChange={onInputChange.bind(null, 'width')}
              placeholder="0"
              disabled={!canEdit()}
            >
              <TextField.Slot side="right" className="text-slate!">
                <Text>px</Text>
              </TextField.Slot>
            </TextField.Root>
          </div>
          <div className="flex-auto flex flex-col gap-2">
            <Text size="1" className="text-slate">Frame height</Text>
            <TextField.Root
              value={state.height ?? 0}
              type="number"
              onChange={onInputChange.bind(null, 'height')}
              placeholder="0"
              disabled={!canEdit()}
            >
              <TextField.Slot side="right" className="text-slate!">
                <Text>px</Text>
              </TextField.Slot>
            </TextField.Root>
          </div>
        </div>
      ) }
      { state.fetching ? (
        <div className="flex items-center justify-center">
          <Spinner />
        </div>
      ) : state.preview && sprite && (
        <div className="flex items-start gap-8">
          <div className="w-1/3! flex-none flex flex-col gap-2">
            <Text size="1" className="text-slate">Preview</Text>
            <Sprite
              sprite={sprite}
              frame={0}
              scale={1}
              className="border border-slate rounded"
            />
            <div className="flex flex-col gap-2">
              <Text size="1" className="text-slate">
                Original size: { state.preview.originalWidth }x{ state.preview.originalHeight }px
              </Text>
              <Text size="1" className="text-slate">
                Sprite size: { state.preview.width }x{ state.preview.height }px
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
              <ChecklistItem condition={checklist[1]}>
                <Text>
                  { tilesCount || 0 } tiles detected
                </Text>
              </ChecklistItem>
              <ChecklistItem condition={checklist[2]}>
                <Text>No compression</Text>
              </ChecklistItem>
              <ChecklistItem condition={checklist[3]}>
                <Text>Colors are indexed</Text>
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

export default SpriteImportForm;
