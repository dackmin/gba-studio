import { type ChangeEvent, useCallback, useReducer } from 'react';
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

import { findMusic, toFileSlug } from '../../../helpers';
import { useApp, useAudio, useModal } from '../../services/hooks';

export interface MusicImportFormState {
  // Internal
  fetching: boolean;
  importing: boolean;
  // Form
  path: string;
  name: string;
}

const MusicImportForm = () => {
  const { projectPath, projectBase, music, onCanvasChange, ...appPayload } = useApp();
  const { selectMusic } = useAudio();
  const { close } = useModal();
  const [state, dispatch] = useReducer(mockState<MusicImportFormState>, {
    fetching: false,
    importing: false,
    // Form
    path: '',
    name: '',
  });

  useTimeout(() => {
    dispatch({ fetching: false });
  }, 400, [state.fetching], { enabled: state.fetching === true });

  const onInputChange = useCallback((name: string, e: ChangeEvent<HTMLInputElement>) => {
    dispatch({ [name]: e.target.value });
  }, []);

  const onBrowse = useCallback(async () => {
    const file = await window.electron.browseFile({
      projectPath,
      filters: [
        { name: 'Music', extensions: ['mod'] },
      ],
    });

    if (file) {
      dispatch({ fetching: true });

      dispatch({
        path: file,
        name: toFileSlug(file.split('/').pop()?.split('.').shift() ?? 'untitled'),
      });
    }
  }, [projectPath]);

  const canEdit = useCallback(() => (
    !state.fetching && !state.importing
  ), [state.fetching, state.importing]);

  const canSubmit = useCallback(() => (
    canEdit() && !!state.path
  ), [canEdit, state.path]);

  const onImport = useCallback(async () => {
    if (!canSubmit()) {
      return;
    }

    dispatch({ importing: true });

    const createdMusic = await window.electron.importMusic(
      projectPath,
      state.path,
      {
        type: 'music',
        name: state.name,
      },
    );

    const exists = findMusic(music, createdMusic.id);

    onCanvasChange?.({
      ...appPayload,
      music: [
        ...!exists ? [createdMusic] : [],
        ...music.map(m => m.id === createdMusic.id ? createdMusic : m),
      ],
    });
    selectMusic?.(createdMusic);
    close();
  }, [
    canSubmit, close, onCanvasChange, selectMusic,
    projectPath, music, appPayload,
    state.path, state.name,
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
          <Text size="1" className="text-slate">Sound location</Text>
          <Badge size="1" variant="soft" color="blue">.mod</Badge>
        </div>
        <TextField.Root
          value={state.path}
          onChange={onInputChange.bind(null, 'path')}
          placeholder="/path/to/my-music.mod"
          disabled={!canEdit()}
          readOnly
          className="cursor-default! [&>input]:cursor-default!"
          onClick={onBrowse}
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
                This sound is already in your project folder, its configuration will be updated
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
              placeholder="My sound name"
              disabled={!canEdit()}
            />
          </div>
        </>
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

export default MusicImportForm;
