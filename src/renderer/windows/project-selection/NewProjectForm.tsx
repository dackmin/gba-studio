import { type ChangeEvent, useCallback, useReducer } from 'react';
import {
  Button,
  Dialog,
  IconButton,
  RadioCards,
  Spinner,
  Text,
  TextField,
  Tooltip,
} from '@radix-ui/themes';
import { cloneDeep, mockState, set } from '@junipero/react';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import slugify from 'slugify';

import type { ProjectTemplate } from '../../../types';

export interface NewProjectFormState {
  type: ProjectTemplate;
  name: string;
  path: string;
  loading: boolean;
}

const NewProjectForm = () => {
  const [state, dispatch] = useReducer(mockState<NewProjectFormState>, {
    type: '2d-sample',
    name: '',
    path: '',
    loading: false,
  });

  const onValueChange = useCallback((name: string, value: any) => {
    set(state, name, value);
    dispatch(cloneDeep(state));
  }, [state]);

  const onInputChange = useCallback((
    name: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    set(state, name, e.target.value);
    dispatch(cloneDeep(state));
  }, [state]);

  const onBrowse = useCallback(async () => {
    const directory = await window.electron.getDirectoryPath({
      suffix: slugify(state.name || 'my-awesome-game'),
    });

    if (directory) {
      onValueChange('path', directory);
    }
  }, [onValueChange, state.name]);

  const onCreate = useCallback(async () => {
    await window.electron.createProject({
      type: state.type,
      name: state.name,
      path: state.path,
    });
  }, [state]);

  const canEdit = useCallback(() => (
    !state.loading
  ), [state.loading]);

  const canSubmit = useCallback(() => (
    canEdit() && !!state.name && !!state.path
  ), [canEdit, state.name, state.path]);

  return (
    <div className="flex flex-col gap-4 pointer-events-auto">
      <RadioCards.Root
        value={state.type}
        onValueChange={onValueChange.bind(null, 'type')}
        disabled={!canEdit()}
      >
        <RadioCards.Item value="2d-sample">Sample 2D Project</RadioCards.Item>
        <RadioCards.Item value="blank">Blank Project</RadioCards.Item>
      </RadioCards.Root>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Project Name</Text>
        <TextField.Root
          value={state.name}
          onChange={onInputChange.bind(null, 'name')}
          placeholder="My Awesome Game"
          disabled={!canEdit()}
          autoFocus
        />
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Project Location</Text>
        <TextField.Root
          value={state.path}
          onChange={onInputChange.bind(null, 'path')}
          placeholder="/path/to/my-awesome-game"
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
      </div>
      <div className="flex items-center gap-2 justify-end mt-4">
        <Dialog.Close>
          <Button
            variant="soft"
            color="gray"
            className="mr-2"
            disabled={!canEdit()}
          >
            <Text>Cancel</Text>
          </Button>
        </Dialog.Close>
        <Button
          variant="solid"
          disabled={!canSubmit()}
          onClick={onCreate}
        >
          { state.loading && <Spinner /> }
          <Text>Create</Text>
        </Button>
      </div>
    </div>
  );
};

export default NewProjectForm;
