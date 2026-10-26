import { type ChangeEvent, type KeyboardEvent, useCallback, useMemo } from 'react';
import {
  Button,
  Heading,
  Inset,
  ScrollArea,
  Select,
  Separator,
  Switch,
  Tabs,
  Text,
  TextField,
  Tooltip,
} from '@radix-ui/themes';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { classNames, set } from '@junipero/react';

import type { GameScene } from '../../../types';
import {
  findBackground,
  getAssetUrl,
  getGraphicName,
  getImageSize,
  getMapSize,
  getStaticGridSize,
  resizeCollisions,
} from '../../../helpers';
import { SceneFormContext } from '../../services/contexts';
import { useApp } from '../../services/hooks';
import { getEventsOfType } from '../../services/events';
import BackgroundsListField from '../../components/BackgroundsListField';
import SpritesListField from '../../components/SpritesListField';
import EventsField from '../../components/EventsField';
import EventValueField from '../../components/EventValueField';

export interface SceneFormProps {
  scene: GameScene;
  onChange?: (scene: GameScene) => void;
}

export interface SceneFormState {
  scene: GameScene;
}

const SceneForm = ({
  scene,
  onChange,
}: SceneFormProps) => {
  const { backgrounds, huds, projectPath, onCanvasChange, ...appPayload } = useApp();
  const onNameChange = useCallback((e: ChangeEvent<HTMLHeadingElement>) => {
    const name = (e.currentTarget.textContent || 'Untitled')
      .trim().slice(0, 32);

    if (name === scene.name) {
      return;
    }

    onChange?.({
      ...scene, name,
    });
  }, [onChange, scene]);

  const onRenameFile = useCallback(async () => {
    if (!scene) {
      return;
    }

    const newFileName = await window.electron.renameSceneFile(
      projectPath,
      scene._file || 'scene_1.json',
      scene,
    );

    if (!newFileName || newFileName === scene._file) {
      return;
    }

    const updatedScene = { ...scene, _file: newFileName };
    onChange?.(updatedScene);
    onCanvasChange?.({
      ...appPayload,
      scenes: appPayload.scenes?.map(s => (
        s.id === scene.id || s._file === scene._file
          ? updatedScene
          : s
      )),
      project: appPayload.project ? {
        ...appPayload.project,
        scenes: appPayload.project.scenes?.map(s => (
          s.id === scene.id || s._file === scene._file
            ? { ...s, _file: newFileName }
            : s
        )),
      } : appPayload.project,
    });
  }, [scene, projectPath, onChange, onCanvasChange, appPayload]);

  const openParentFolder = useCallback(async () => {
    if (!scene?._file) {
      return;
    }

    await window.electron.openParentFolder(
      projectPath,
      `project://content/${scene._file}`
    );
  }, [scene?._file, projectPath]);

  const onValueChange = useCallback((name: string, value: any) => {
    set(scene, name, value);
    onChange?.(scene);
  }, [onChange, scene]);

  const syncMapSize = useCallback(async (backgroundId?: string) => {
    const background = findBackground(backgrounds, backgroundId);

    const [pixelWidth, pixelHeight] = await getImageSize(
      !backgroundId || backgroundId === 'bg_default' || !background
        ? `resources://public/templates/commons/graphics/bg_default.bmp`
        : getAssetUrl(background)
    );

    scene.map = scene.map || {
      type: 'map',
      gridSize: 16,
      width: 0,
      height: 0,
    };

    const gridSize = getStaticGridSize(scene.map.gridSize ?? 16);

    if (scene.sceneType !== 'logos' && gridSize) {
      const { width, height } = getMapSize(pixelWidth, pixelHeight, gridSize);

      if (scene.map.collisions?.length) {
        scene.map.collisions = resizeCollisions(
          scene.map.collisions, width, height);
      }

      scene.map.width = width;
      scene.map.height = height;
    }
  }, [scene, backgrounds]);

  const onBackgroundChange = useCallback(async (value: string) => {
    await syncMapSize(value);
    onValueChange('background', getGraphicName(value || 'bg_default'));
  }, [syncMapSize, onValueChange]);

  const onGridSizeChange = useCallback(async (value: any) => {
    onValueChange('map.gridSize', value);
    await syncMapSize(scene.background);
    onChange?.(scene);
  }, [scene, syncMapSize, onValueChange, onChange]);

  const onHudChange = useCallback((value: string) => {
    if (value === 'none') {
      delete scene.hud;
      onChange?.(scene);

      return;
    }

    onValueChange('hud', value);
  }, [onChange, onValueChange, scene]);

  const onTypeChange = useCallback((name: string, value: string) => {
    if (value !== scene.sceneType) {
      set(scene, name, value);

      if (!['logos', 'point-and-click'].includes(value) && !scene.player) {
        scene.player = { type: 'player', x: 0, y: 0 };
      }

      onBackgroundChange(scene.background || '');
    } else {
      set(scene, name, value);
      onChange?.(scene);
    }
  }, [onBackgroundChange, onChange, scene]);

  const onCursorChange = useCallback((value: string) => {
    if (!value) {
      delete scene.cursor;
      onChange?.(scene);

      return;
    }

    onValueChange('cursor', value);
  }, [onChange, onValueChange, scene]);

  const onPlayerToggle = useCallback((checked: boolean) => {
    if (checked) {
      scene.player = scene.player || { type: 'player', x: 0, y: 0 };
    } else {
      delete scene.player;
    }

    onChange?.(scene);
  }, [onChange, scene]);

  const onNameKeyDown = (e: KeyboardEvent<HTMLHeadingElement>) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const getContext = useCallback(() => ({
    scene,
  }), [scene]);

  const hasFadeInEvent = useMemo(() => (
    getEventsOfType('fade-in', scene.events || []).length > 0
  ), [scene.events]);

  return (
    <SceneFormContext value={getContext()}>
      <ScrollArea size="1" scrollbars="vertical">
        <div className="p-3">
          <Text size="1" className="text-slate">Scene</Text>
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
            { scene.name }
          </Heading>
          <Inset side="x"><Separator className="!w-full my-4" /></Inset>
          <div>
            <Text size="1" className="text-slate">File</Text>
            <div className="flex items-center gap-2">
              <Text className="flex-auto truncate">
                { scene._file ? `content/${scene._file}` : 'Not saved' }
              </Text>
              <Button
                type="button"
                size="1"
                className="flex-none"
                onClick={onRenameFile}
              >
                Rename
              </Button>
              <Button
                type="button"
                size="1"
                className="flex-none"
                onClick={openParentFolder}
              >
                Open
              </Button>
            </div>
          </div>
          <Inset side="x"><Separator className="!w-full my-4" /></Inset>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Text className="block text-slate" size="1">Scene type</Text>
              <Select.Root
                value={scene?.sceneType ?? 'logos'}
                onValueChange={onTypeChange.bind(null, 'sceneType')}
              >
                <Select.Trigger className="w-full" />
                <Select.Content>
                  <Select.Item value="logos">Logos</Select.Item>
                  <Select.Item value="2d-top-down">Top Down 2D</Select.Item>
                  <Select.Item value="side-scroller">Side Scroller</Select.Item>
                  <Select.Item value="point-and-click">Point & Click</Select.Item>
                </Select.Content>
              </Select.Root>
            </div>
            <div className="flex flex-col gap-2">
              <Text className="block text-slate" size="1">Background</Text>
              <BackgroundsListField
                value={scene?.background || ''}
                onValueChange={onBackgroundChange}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Text className="block text-slate" size="1">HUD</Text>
              <Select.Root
                value={huds.some(h => h.id === scene.hud) ? scene.hud : 'none'}
                onValueChange={onHudChange}
              >
                <Select.Trigger className="w-full" />
                <Select.Content>
                  <Select.Item value="none">None</Select.Item>
                  { huds.map(hud => (
                    <Select.Item key={hud.id} value={hud.id}>
                      { hud.name }
                    </Select.Item>
                  )) }
                </Select.Content>
              </Select.Root>
            </div>
            { scene.sceneType === 'point-and-click' && (
              <>
                <div className="flex flex-col gap-2">
                  <Text className="block text-slate" size="1">Cursor sprite</Text>
                  <SpritesListField
                    value={scene.cursor ?? ''}
                    defaultGraphic="cursor_default"
                    onValueChange={onCursorChange}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Text className="block text-slate" size="1">Has player</Text>
                  <Switch
                    size="1"
                    checked={!!scene.player}
                    onCheckedChange={onPlayerToggle}
                  />
                </div>
              </>
            ) }
            { scene.sceneType !== 'logos' && (
              <div className="flex flex-col gap-2">
                <Text className="block text-slate" size="1">Grid size</Text>
                <EventValueField
                  type="number"
                  value={scene.map?.gridSize ?? 16}
                  onValueChange={onGridSizeChange}
                >
                  <TextField.Slot side="right">px</TextField.Slot>
                </EventValueField>
              </div>
            ) }
          </div>
          <Inset side="x"><Separator className="!w-full my-4" /></Inset>
          <div className="flex flex-col gap-4 pb-10">
            <div className="flex flex-col gap-2">
              <Text className="block text-slate" size="1">Events</Text>
              <Inset className="!rounded-none !overflow-visible">
                <Tabs.Root defaultValue="init">
                  <Tabs.List size="1" className="px-1">
                    <Tabs.Trigger value="init">
                      <div className="inline-flex items-center gap-2">
                        <Text>On Init</Text>
                        { !hasFadeInEvent && (
                          <Tooltip
                            content={(
                              <Text>
                                Scenes should have at-least a fade-in event to avoid a black screen
                                on start.
                              </Text>
                            )}
                          >
                            <ExclamationTriangleIcon width={12} color="orange" />
                          </Tooltip>
                        ) }
                      </div>
                    </Tabs.Trigger>
                  </Tabs.List>

                  <Tabs.Content value="init">
                    <EventsField
                      value={scene.events ?? []}
                      onValueChange={onValueChange.bind(null, 'events')}
                    />
                  </Tabs.Content>
                </Tabs.Root>
              </Inset>
            </div>
          </div>
        </div>
      </ScrollArea>
    </SceneFormContext>
  );
};

export default SceneForm;
