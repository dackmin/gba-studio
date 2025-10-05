import { ChangeEvent, useCallback, useReducer } from 'react';
import { Button, Dialog, IconButton, RadioCards, Text, TextField, Tooltip } from '@radix-ui/themes';
import { cloneDeep, mockState, set } from '@junipero/react';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import slugify from 'slugify';

export interface NewProjectFormState {
  type: 'blank' | '2d-sample';
  name: string;
  path: string;
}

const NewProjectForm = () => {
  const [state, dispatch] = useReducer(mockState<NewProjectFormState>, {
    type: '2d-sample',
    name: '',
    path: '',
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

  return (
    <div className="flex flex-col gap-4 pointer-events-auto">
      <RadioCards.Root
        value={state.type}
        onValueChange={onValueChange.bind(null, 'type')}
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
        />
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Project Location</Text>
        <TextField.Root
          value={state.path}
          onChange={onInputChange.bind(null, 'path')}
          placeholder="/path/to/my-awesome-game"
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
          <Button variant="soft" color="gray" className="mr-2">
            <Text>Cancel</Text>
          </Button>
        </Dialog.Close>
        <Button
          variant="solid"
          disabled={!state.name || !state.path}
        >
          <Text>Create</Text>
        </Button>
      </div>
    </div>
  );
};

export default NewProjectForm;
