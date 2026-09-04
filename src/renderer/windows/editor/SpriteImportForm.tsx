import { type ChangeEvent, useCallback, useMemo, useReducer } from 'react';
import { mockState, useTimeout } from '@junipero/react';
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

import type { GameSpriteFile, SpriteBitmap } from '../../../types';
import { findSprite, getTilesCount, toFileSlug } from '../../../helpers';
import { useApp, useDelayedValue, useModal, useSprite } from '../../services/hooks';
import Sprite from '../../components/Sprite';
import ChecklistItem from '../../components/ChecklistItem';

export interface SpriteImportFormProps {
  path?: string;
}

export interface SpriteImportFormState {
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

const SpriteImportForm = ({
  path: initialPath,
}: SpriteImportFormProps) => {
  const { projectPath, projectBase, sprites, onCanvasChange, ...appPayload } = useApp();
  const { selectSprite } = useSprite();
  const { close } = useModal();
  const [state, dispatch] = useReducer(mockState<SpriteImportFormState>, {
    fetching: false,
    importing: false,
    preview: undefined,
    // Form
    path: initialPath || '',
    name: '',
    width: 0,
    height: 0,
  });

  useTimeout(() => {
    dispatch({ fetching: false });
  }, 400, [state.preview, state.fetching], { enabled: state.fetching === true });

  const onInputChange = useCallback((name: string, e: ChangeEvent<HTMLInputElement>) => {
    dispatch({ [name]: e.target.value });
  const loadFile = useCallback(async (file: string) => {
    dispatch({ fetching: true });

    const imageContent = await window.electron.loadImage(projectPath, file, 'sprite');

    const width = imageContent.width > imageContent.height
      ? imageContent.height : imageContent.width;
    const height = imageContent.height > imageContent.width
      ? imageContent.width : imageContent.height;

    dispatch({
      path: file,
      fileName: (file.split('/').pop()?.split('.').shift() ?? 'untitled') + '.bmp',
      name: toFileSlug(file.split('/').pop()?.split('.').shift() ?? 'untitled'),
      transparentColor: rgba2hex({
        r: imageContent.transparentColor?.[0] ?? 0,
        g: imageContent.transparentColor?.[1] ?? 0,
        b: imageContent.transparentColor?.[2] ?? 0,
      }),
      preview: imageContent,
      width,
      height,
    });
  }, [projectPath]);

  useEffect(() => {
    if (initialPath) {
      loadFile(initialPath);
    }
    // eslint-disable-next-line react/exhaustive-deps
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
  ]), [tilesCount, state.preview]);

  const canSubmit = useCallback(() => (
    canEdit() && !!state.path && !!state.width && !!state.height && !!state.name &&
    checklist.every(c => c === true)
  ), [canEdit, state.path, state.width, state.height, state.name, checklist]);

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
        name: state.name,
        width: state.width,
        height: state.height,
      },
    );

    const exists = findSprite(sprites, createdSprite.id);

    onCanvasChange?.({
      ...appPayload,
      sprites: [
        ...!exists ? [createdSprite] : [],
        ...sprites.map(s => s.id === createdSprite.id ? createdSprite : s),
      ],
    });
    selectSprite?.(createdSprite);
    close();
  }, [
    canSubmit, close, onCanvasChange, selectSprite,
    projectPath, sprites, appPayload,
    state.path, state.width, state.height, state.name,
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
          <Text size="1" className="text-slate">Sprite location</Text>
          <Badge size="1" variant="soft" color="blue">.bmp</Badge>
          <Badge size="1" variant="soft" color="blue">.png</Badge>
          <Badge size="1" variant="soft" color="blue">.jpg</Badge>
        </div>
        <TextField.Root
          value={state.path}
          onChange={onInputChange.bind(null, 'path')}
          placeholder="Select a sprite file"
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
        { state.path.startsWith(projectBase) && (
          <Callout.Root>
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text className="flex flex-col items-start gap-2">
              <Text>
                This sprite is already in your project folder, its configuration will be updated
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
        </>
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
                  { tilesCount || 0 } frames detected
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

export default SpriteImportForm;
