import { type ChangeEvent, useCallback, useReducer } from 'react';
import { Button, Card, Heading, Tabs, Text, TextField } from '@radix-ui/themes';
import { cloneDeep, mockState, set } from '@junipero/react';
import {
  PlusCircledIcon,
  TrashIcon,
  TriangleDownIcon,
  TriangleLeftIcon,
  TriangleRightIcon,
  TriangleUpIcon,
} from '@radix-ui/react-icons';
import { v4 as uuid } from 'uuid';

import type {
  GameProject,
} from '../../../types';
import { useApp } from '../../services/hooks';
import ConstrainedView from '../../windows/editor/ConstrainedView';
import ConfigurationForm from './ConfigurationForm';
import FontsListField from '../../components/FontsListField';
import SpritesListField from '../../components/SpritesListField';
import ColorField from '../../components/ColorField';

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
      romName: '',
      romCode: '',
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
    onProjectChange?.(state.project);
  }, [state.project, onProjectChange]);

  const onValueChange = useCallback((
    name: string,
    value: any
  ) => {
    set(state.project, name, value);
    dispatch({ project: state.project });
    onProjectChange?.(state.project);
  }, [state.project, onProjectChange]);

  const onFieldBlur = useCallback(() => {
    onProjectChange?.(state.project);
  }, [state.project, onProjectChange]);

  const onAddConfiguration = useCallback(() => {
    const newConfig = {
      id: uuid(),
      name: 'New Configuration',
      settings: {
        logsEnabled: true,
      },
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
      onProjectChange?.(state.project);
    }
  }, [state.project, onProjectChange]);

  const onConfigurationValueChange = useCallback((
    id: string,
    name: string,
    value: any
  ) => {
    const config = state.project.configurations
      ?.find(c => c.id === id);

    if (config) {
      set(config, name, value);
      dispatch({ project: state.project });
      onProjectChange?.(state.project);
    }
  }, [state.project, onProjectChange]);

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
            <div className="flex flex-col items-start gap-2">
              <Text>ROM Name</Text>
              <TextField.Root
                size="3"
                value={state.project?.romName || state.project?.name}
                onChange={onTextChange.bind(null, 'romName')}
                placeholder="My GBA Project"
                className="w-96"
                onBlur={onProjectChange?.bind(null, state.project)}
              />
            </div>
            <div className="flex flex-col items-start gap-2">
              <Text>ROM Code</Text>
              <TextField.Root
                size="3"
                value={state.project?.romCode}
                onChange={onTextChange.bind(null, 'romCode')}
                placeholder="MYGBAGAME"
                className="w-96"
                onBlur={onProjectChange?.bind(null, state.project)}
              />
            </div>
          </Card>
        </div>
        <div className="flex flex-col gap-3">
          <Heading size="3">Texts</Heading>
          <Card className="!flex flex-col gap-4">
            <div className="flex flex-col items-start gap-2">
              <Text>Default Font</Text>
              <FontsListField
                size="3"
                className="w-96!"
                value={state.project?.settings?.font || ''}
                onValueChange={onValueChange.bind(null, 'settings.font')}
              />
            </div>
            <div className="flex flex-col items-start gap-2">
              <Text>Default Text Color</Text>
              <ColorField
                className="w-96!"
                value={state.project?.settings?.textColor || '#000'}
                placeholder="#000"
                onValueChange={onValueChange.bind(null, 'settings.textColor')}
              />
            </div>
          </Card>
        </div>
        <div className="flex flex-col gap-3">
          <Heading size="3">Dialogs</Heading>
          <Card className="!flex flex-col gap-4">
            <div className="flex flex-col items-start gap-2">
              <Text>Default Dialog Sprite</Text>
              <SpritesListField
                className="w-96!"
                nullable={true}
                value={state.project?.settings?.dialogSprite || ''}
                onValueChange={onValueChange.bind(null, 'settings.dialogSprite')}
              />
              <Text size="1" color="gray">
                Only use 16px vertical spritesheets.
              </Text>
            </div>
            <div className="flex flex-col items-start gap-2">
              <Text>Dialog Paddings</Text>
              <div className="flex items-center gap-1 w-96">
                <TextField.Root
                  value={state.project?.settings?.dialogPaddingTop || ''}
                  onChange={onTextChange.bind(null, 'settings.dialogPaddingTop')}
                  placeholder="8"
                  className="flex-auto w-auto"
                >
                  <TextField.Slot side="left">
                    <TriangleUpIcon />
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    px
                  </TextField.Slot>
                </TextField.Root>
                <TextField.Root
                  value={state.project?.settings?.dialogPaddingRight || ''}
                  onChange={onTextChange.bind(null, 'settings.dialogPaddingRight')}
                  placeholder="8"
                  className="flex-auto w-auto"
                >
                  <TextField.Slot side="left">
                    <TriangleRightIcon />
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    px
                  </TextField.Slot>
                </TextField.Root>
                <TextField.Root
                  value={state.project?.settings?.dialogPaddingBottom || ''}
                  onChange={onTextChange.bind(null, 'settings.dialogPaddingBottom')}
                  placeholder="8"
                  className="flex-auto w-auto"
                >
                  <TextField.Slot side="left">
                    <TriangleDownIcon />
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    px
                  </TextField.Slot>
                </TextField.Root>
                <TextField.Root
                  value={state.project?.settings?.dialogPaddingLeft || ''}
                  onChange={onTextChange.bind(null, 'settings.dialogPaddingLeft')}
                  placeholder="8"
                  className="flex-auto w-auto"
                >
                  <TextField.Slot side="left">
                    <TriangleLeftIcon />
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    px
                  </TextField.Slot>
                </TextField.Root>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2">
              <Text>Dialog Margins</Text>
              <div className="flex items-center gap-1 w-96">
                <TextField.Root
                  value={state.project?.settings?.dialogMarginTop || ''}
                  onChange={onTextChange.bind(null, 'settings.dialogMarginTop')}
                  placeholder="4"
                  className="flex-auto w-auto"
                >
                  <TextField.Slot side="left">
                    <TriangleUpIcon />
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    px
                  </TextField.Slot>
                </TextField.Root>
                <TextField.Root
                  value={state.project?.settings?.dialogMarginRight || ''}
                  onChange={onTextChange.bind(null, 'settings.dialogMarginRight')}
                  placeholder="4"
                  className="flex-auto w-auto"
                >
                  <TextField.Slot side="left">
                    <TriangleRightIcon />
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    px
                  </TextField.Slot>
                </TextField.Root>
                <TextField.Root
                  value={state.project?.settings?.dialogMarginBottom || ''}
                  onChange={onTextChange.bind(null, 'settings.dialogMarginBottom')}
                  placeholder="4"
                  className="flex-auto w-auto"
                >
                  <TextField.Slot side="left">
                    <TriangleDownIcon />
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    px
                  </TextField.Slot>
                </TextField.Root>
                <TextField.Root
                  value={state.project?.settings?.dialogMarginLeft || ''}
                  onChange={onTextChange.bind(null, 'settings.dialogMarginLeft')}
                  placeholder="4"
                  className="flex-auto w-auto"
                >
                  <TextField.Slot side="left">
                    <TriangleLeftIcon />
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    px
                  </TextField.Slot>
                </TextField.Root>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2">
              <Text>Portrait Gap</Text>
              <TextField.Root
                value={state.project?.settings?.dialogPortraitGap || ''}
                onChange={onTextChange.bind(null, 'settings.dialogPortraitGap')}
                placeholder="8"
                className="w-96!"
              >
                <TextField.Slot side="right">
                  px
                </TextField.Slot>
              </TextField.Root>
              <Text size="1" color="gray">
                Gap between the portrait and the dialog text, when portrait is displayed.
              </Text>
            </div>
          </Card>
        </div>
        <div className="flex flex-col gap-3">
          <Heading size="3">Menus</Heading>
          <Card className="!flex flex-col gap-4">
            <div className="flex flex-col items-start gap-2">
              <Text>Default Menu Sprite</Text>
              <SpritesListField
                className="w-96!"
                nullable={true}
                value={state.project?.settings?.menuSprite || ''}
                onValueChange={onValueChange.bind(null, 'settings.menuSprite')}
              />
              <Text size="1" color="gray">
                Only use 16px vertical spritesheets.
              </Text>
            </div>
            <div className="flex flex-col items-start gap-2">
              <Text>Menu Paddings</Text>
              <div className="flex items-center gap-1 w-96">
                <TextField.Root
                  value={state.project?.settings?.menuPaddingTop || ''}
                  onChange={onTextChange.bind(null, 'settings.menuPaddingTop')}
                  placeholder="8"
                  className="flex-auto w-auto"
                >
                  <TextField.Slot side="left">
                    <TriangleUpIcon />
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    px
                  </TextField.Slot>
                </TextField.Root>
                <TextField.Root
                  value={state.project?.settings?.menuPaddingRight || ''}
                  onChange={onTextChange.bind(null, 'settings.menuPaddingRight')}
                  placeholder="8"
                  className="flex-auto w-auto"
                >
                  <TextField.Slot side="left">
                    <TriangleRightIcon />
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    px
                  </TextField.Slot>
                </TextField.Root>
                <TextField.Root
                  value={state.project?.settings?.menuPaddingBottom || ''}
                  onChange={onTextChange.bind(null, 'settings.menuPaddingBottom')}
                  placeholder="8"
                  className="flex-auto w-auto"
                >
                  <TextField.Slot side="left">
                    <TriangleDownIcon />
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    px
                  </TextField.Slot>
                </TextField.Root>
                <TextField.Root
                  value={state.project?.settings?.menuPaddingLeft || ''}
                  onChange={onTextChange.bind(null, 'settings.menuPaddingLeft')}
                  placeholder="8"
                  className="flex-auto w-auto"
                >
                  <TextField.Slot side="left">
                    <TriangleLeftIcon />
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    px
                  </TextField.Slot>
                </TextField.Root>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2">
              <Text>Menu Arrow Gap</Text>
              <TextField.Root
                value={state.project?.settings?.menuArrowGap || ''}
                onChange={onTextChange.bind(null, 'settings.menuArrowGap')}
                placeholder="4"
                className="w-96"
              >
                <TextField.Slot side="right">
                  px
                </TextField.Slot>
              </TextField.Root>
              <Text size="1" color="gray">
                Gap between menu items and the arrow indicator.
              </Text>
            </div>
            <div className="flex flex-col items-start gap-2">
              <Text>Menu Margins</Text>
              <div className="flex items-center gap-1 w-96">
                <TextField.Root
                  value={state.project?.settings?.menuMarginTop || ''}
                  onChange={onTextChange.bind(null, 'settings.menuMarginTop')}
                  placeholder="4"
                  className="flex-auto w-auto"
                >
                  <TextField.Slot side="left">
                    <TriangleUpIcon />
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    px
                  </TextField.Slot>
                </TextField.Root>
                <TextField.Root
                  value={state.project?.settings?.menuMarginRight || ''}
                  onChange={onTextChange.bind(null, 'settings.menuMarginRight')}
                  placeholder="4"
                  className="flex-auto w-auto"
                >
                  <TextField.Slot side="left">
                    <TriangleRightIcon />
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    px
                  </TextField.Slot>
                </TextField.Root>
                <TextField.Root
                  value={state.project?.settings?.menuMarginBottom || ''}
                  onChange={onTextChange.bind(null, 'settings.menuMarginBottom')}
                  placeholder="4"
                  className="flex-auto w-auto"
                >
                  <TextField.Slot side="left">
                    <TriangleDownIcon />
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    px
                  </TextField.Slot>
                </TextField.Root>
                <TextField.Root
                  value={state.project?.settings?.menuMarginLeft || ''}
                  onChange={onTextChange.bind(null, 'settings.menuMarginLeft')}
                  placeholder="4"
                  className="flex-auto w-auto"
                >
                  <TextField.Slot side="left">
                    <TriangleLeftIcon />
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    px
                  </TextField.Slot>
                </TextField.Root>
              </div>
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
                    { /* A span instead of IconButton: Tabs.Trigger renders a
                      <button>, and buttons can't be nested in buttons */ }
                    <span
                      role="button"
                      aria-label="Remove configuration"
                      tabIndex={-1}
                      className="cursor-pointer"
                      onClick={e => {
                        e.stopPropagation();
                        e.preventDefault();
                        onRemoveConfiguration(config.id);
                      }}
                    >
                      <TrashIcon />
                    </span>
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
                onValueChange={onValueChange}
              />
            </Tabs.Content>
            { state.project.configurations?.map(config => (
              <Tabs.Content key={config.id} value={config.id}>
                <ConfigurationForm
                  name={config.name || ''}
                  settings={config.settings || {}}
                  onTextChange={onConfigurationTextChange.bind(null, config.id)}
                  onFieldBlur={onFieldBlur}
                  onValueChange={onConfigurationValueChange.bind(null, config.id)}
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

export { default as BottomBar } from './BottomBar';
