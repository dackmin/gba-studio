import { type ChangeEvent, useCallback, useReducer } from 'react';
import { Button, Card, Heading, IconButton, Tabs, Text, TextField } from '@radix-ui/themes';
import { cloneDeep, mockState, set } from '@junipero/react';
import { PlusCircledIcon, TrashIcon } from '@radix-ui/react-icons';
import { v4 as uuid } from 'uuid';

import type {
  GameProject,
} from '../../../types';
import { useApp } from '../../services/hooks';
import ConstrainedView from '../../windows/editor/ConstrainedView';
import ConfigurationForm from './ConfigurationForm';

export interface SettingsState {
  project: GameProject;
  selectedConfiguration?: string;
}

const Settings = () => {
  const { project, onProjectChange } = useApp();
  const [state, dispatch] = useReducer(mockState<SettingsState>, {
    selectedConfiguration: 'default',
    project: cloneDeep(project || {
      name: '',
      scenes: [],
      settings: {},
      configurations: [],
    }),
  });

  const onSelectConfiguration = useCallback((value: string) => {
    dispatch({ selectedConfiguration: value });
  }, []);

  const onTextChange = useCallback((
    name: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    set(state.project, name, e.target.value);
    dispatch({ project: state.project });
  }, []);

  const onFieldBlur = useCallback(() => {
    onProjectChange?.(state.project);
  }, [state.project, onProjectChange]);

  const onAddConfiguration = useCallback(() => {
    const newConfig = {
      id: uuid(),
      name: 'New Configuration',
      settings: {},
    };
    state.project.configurations = [
      ...(state.project.configurations || []),
      newConfig,
    ];
    dispatch({
      project: state.project,
      selectedConfiguration: newConfig.id,
    });
    onProjectChange?.(state.project);
  }, [state.project, onProjectChange]);

  const onRemoveConfiguration = useCallback((id: string) => {
    state.project.configurations = (state.project.configurations || [])
      .filter(config => config.id !== id);
    dispatch({
      project: state.project,
      selectedConfiguration: state.selectedConfiguration === id
        ? 'default'
        : state.selectedConfiguration,
    });
    onProjectChange?.(state.project);
  }, [state.project, state.selectedConfiguration, onProjectChange]);

  const onConfigurationTextChange = useCallback((
    id: string,
    name: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const config = state.project.configurations
      ?.find(c => c.id === id);

    if (config) {
      set(config, name, e.target.value);
      dispatch({ project: state.project });
    }
  }, [state.project]);

  return (
    <ConstrainedView>
      <div className="container px-2 py-6 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Heading size="3">Project settings</Heading>
          <Card className="!flex flex-col gap-4">
            <div className="flex flex-col items-start gap-2">
              <Text>Name</Text>
              <TextField.Root
                size="3"
                value={state.project?.name}
                onChange={onTextChange.bind(null, 'name')}
                placeholder="My GBA Project"
                className="w-96"
                onBlur={onProjectChange?.bind(null, state.project)}
              />
            </div>
          </Card>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <Heading size="3">Build configurations</Heading>
            <Button
              size="1"
              variant="soft"
              onClick={onAddConfiguration}
            >
              <PlusCircledIcon />
              <Text>Add configuration</Text>
            </Button>
          </div>
          <Tabs.Root
            value={state.selectedConfiguration}
            onValueChange={onSelectConfiguration}
          >
            <Tabs.List>
              <Tabs.Trigger value="default">Default</Tabs.Trigger>
              { project?.configurations?.map(config => (
                <Tabs.Trigger key={config.id} value={config.id}>
                  <div className="!flex items-center gap-2">
                    <Text>{ config.name || 'Unnamed' }</Text>
                    <IconButton
                      variant="ghost"
                      size="1"
                      onClick={onRemoveConfiguration.bind(null, config.id)}
                    >
                      <TrashIcon />
                    </IconButton>
                  </div>
                </Tabs.Trigger>
              )) }
            </Tabs.List>
            <Tabs.Content value="default">
              <ConfigurationForm
                default
                settings={state.project.settings || {}}
                onTextChange={onTextChange}
                onFieldBlur={onFieldBlur}
              />
            </Tabs.Content>
            { state.project.configurations?.map(config => (
              <Tabs.Content key={config.id} value={config.id}>
                <ConfigurationForm
                  name={config.name || ''}
                  settings={config.settings || {}}
                  onTextChange={onConfigurationTextChange.bind(null, config.id)}
                  onFieldBlur={onFieldBlur}
                />
              </Tabs.Content>
            )) }
          </Tabs.Root>
        </div>
      </div>
    </ConstrainedView>
  );
};

export default Settings;
