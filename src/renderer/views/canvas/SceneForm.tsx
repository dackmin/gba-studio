import {
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  useCallback,
  useMemo,
} from 'react';
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
import { CheckCircledIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { classNames, set } from '@junipero/react';

import type { GameScene } from '../../../types';
import {
  DEFAULT_GRAVITY_FORCE,
  DEFAULT_JUMP_HEIGHT,
  DEFAULT_SCROLL_SPEED,
  DEFAULT_PLAYER_INERTIA,
} from '../../../commons';
import {
  findBackground,
  getAssetUrl,
  getGraphicName,
  getGridSize,
  getImageSize,
  getMapSize,
  getStartingSceneId,
  resizeCollisions,
} from '../../../helpers';
import { SceneFormContext } from '../../services/contexts';
import { useApp } from '../../services/hooks';
import { getEventsOfType } from '../../services/events';
import BackgroundsListField from '../../components/BackgroundsListField';
import SpritesListField from '../../components/SpritesListField';
import EventsField from '../../components/EventsField';
import EventValueField, {
  EXCLUDE_ALL_EXCEPT_VALUE_AND_VARIABLES,
} from '../../components/EventValueField';
import Collapsible from '../../components/Collapsible';

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
  const {
    backgrounds, huds, projectPath, onCanvasChange, onProjectChange,
    ...appPayload
  } = useApp();
  const isStartingScene = getStartingSceneId(
    appPayload.project, appPayload.scenes) === scene.id;

  const onSetStartingScene = useCallback(() => {
    if (!appPayload.project) {
      return;
    }

    onProjectChange?.({ ...appPayload.project, startingScene: scene.id });
  }, [appPayload.project, scene.id, onProjectChange]);

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

    const gridSize = getGridSize(scene.map.gridSize);

    if (scene.sceneType !== 'logos') {
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

  const onGridSizeChange = useCallback(async (e: FocusEvent<HTMLInputElement>) => {
    const size = getGridSize(e.target.value);

    if (size === scene.map?.gridSize) {
      return;
    }

    onValueChange('map.gridSize', size);
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

  const hasGravity = scene.sceneType === 'side-scroller' || (
    scene.sceneType === 'point-and-click' && !!scene.player && !!scene.gravity
  );

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
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
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
            <div className="flex flex-col gap-2">
              <Text size="1" className="text-slate">Starting Scene</Text>
              <div className="flex items-center gap-2">
                { isStartingScene ? (
                  <div className="flex items-center gap-1">
                    <CheckCircledIcon color="green" />
                    <Text size="2">This Scene</Text>
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="1"
                    onClick={onSetStartingScene}
                  >
                    Set as starting scene
                  </Button>
                ) }
              </div>
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
                  <Select.Item value="adventure">Adventure</Select.Item>
                  <Select.Item value="shoot-em-all">Shoot 'em all</Select.Item>
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
            <Collapsible.Root>
              <Collapsible.Trigger className="px-0! py-0! text-sm! text-slate">
                Advanced
              </Collapsible.Trigger>
              <Collapsible.Content className="mt-4! flex flex-col gap-4">
                { scene.sceneType !== 'logos' && (
                  <div className="flex flex-col gap-2">
                    <Text className="block text-slate" size="1">Grid size</Text>
                    <TextField.Root
                      key={`${scene.id}-${scene.map?.gridSize}`}
                      type="number"
                      min={1}
                      step={1}
                      defaultValue={scene.map?.gridSize ?? 16}
                      onBlur={onGridSizeChange}
                    >
                      <TextField.Slot side="right">px</TextField.Slot>
                    </TextField.Root>
                  </div>
                ) }
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
                { scene.sceneType === 'shoot-em-all' && (
                  <>
                    <div className="flex flex-col gap-2">
                      <Text className="block text-slate" size="1">Scroll direction</Text>
                      <Select.Root
                        value={scene.scrollDirection ?? 'right'}
                        onValueChange={onValueChange.bind(null, 'scrollDirection')}
                      >
                        <Select.Trigger className="w-full" />
                        <Select.Content>
                          <Select.Item value="right">Right</Select.Item>
                          <Select.Item value="left">Left</Select.Item>
                          <Select.Item value="up">Up</Select.Item>
                          <Select.Item value="down">Down</Select.Item>
                        </Select.Content>
                      </Select.Root>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Text className="block text-slate" size="1">Scroll speed</Text>
                      <EventValueField
                        type="number"
                        min={0}
                        step={0.25}
                        excludeTypes={EXCLUDE_ALL_EXCEPT_VALUE_AND_VARIABLES}
                        value={scene.scrollSpeed ?? DEFAULT_SCROLL_SPEED}
                        onValueChange={onValueChange.bind(null, 'scrollSpeed')}
                      >
                        <TextField.Slot side="right">px/frame</TextField.Slot>
                      </EventValueField>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Text className="block text-slate" size="1">Player movement</Text>
                      <Select.Root
                        value={scene.playerAxis ?? 'both'}
                        onValueChange={onValueChange.bind(null, 'playerAxis')}
                      >
                        <Select.Trigger className="w-full" />
                        <Select.Content>
                          <Select.Item value="both">Both axes</Select.Item>
                          <Select.Item value="horizontal">Horizontal only</Select.Item>
                          <Select.Item value="vertical">Vertical only</Select.Item>
                        </Select.Content>
                      </Select.Root>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Text className="block text-slate" size="1">Player inertia</Text>
                      <EventValueField
                        type="number"
                        min={0}
                        max={95}
                        step={5}
                        excludeTypes={EXCLUDE_ALL_EXCEPT_VALUE_AND_VARIABLES}
                        value={scene.playerInertia ?? DEFAULT_PLAYER_INERTIA}
                        onValueChange={onValueChange.bind(null, 'playerInertia')}
                      >
                        <TextField.Slot side="right">%</TextField.Slot>
                      </EventValueField>
                    </div>
                  </>
                ) }
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
                    <div className="flex flex-col gap-2">
                      <Text className="block text-slate" size="1">Has player</Text>
                      <Switch
                        checked={!!scene.player}
                        onCheckedChange={onPlayerToggle}
                      />
                    </div>
                    { !!scene.player && (
                      <div className="flex flex-col gap-2">
                        <Text className="block text-slate" size="1">
                          Player reacts to gravity
                        </Text>
                        <Switch
                          checked={!!scene.gravity}
                          onCheckedChange={onValueChange.bind(null, 'gravity')}
                        />
                      </div>
                    ) }
                  </>
                ) }
                { hasGravity && (
                  <>
                    <div className="flex flex-col gap-2">
                      <Text className="block text-slate" size="1">Gravity</Text>
                      <EventValueField
                        type="number"
                        step={0.1}
                        excludeTypes={EXCLUDE_ALL_EXCEPT_VALUE_AND_VARIABLES}
                        value={scene.gravityForce ?? DEFAULT_GRAVITY_FORCE}
                        onValueChange={onValueChange.bind(null, 'gravityForce')}
                      >
                        <TextField.Slot side="right">px/frame²</TextField.Slot>
                      </EventValueField>
                    </div>
                    { scene.sceneType === 'side-scroller' && (
                      <div className="flex flex-col gap-2">
                        <Text className="block text-slate" size="1">Jump height</Text>
                        <EventValueField
                          type="number"
                          excludeTypes={EXCLUDE_ALL_EXCEPT_VALUE_AND_VARIABLES}
                          value={scene.jumpHeight ?? DEFAULT_JUMP_HEIGHT}
                          onValueChange={onValueChange.bind(null, 'jumpHeight')}
                        >
                          <TextField.Slot side="right">px</TextField.Slot>
                        </EventValueField>
                      </div>
                    ) }
                  </>
                ) }
              </Collapsible.Content>
            </Collapsible.Root>
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
