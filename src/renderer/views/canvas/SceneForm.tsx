import { type ChangeEvent, type KeyboardEvent, useCallback } from 'react';
import {
  Heading,
  Inset,
  Select,
  Separator,
  Tabs,
  Text,
} from '@radix-ui/themes';
import { classNames, set } from '@junipero/react';

import type { GameScene } from '../../../types';
import { getGraphicName, pixelToTile } from '../../../helpers';
import { SceneFormContext } from '../../services/contexts';
import BackgroundsListField from '../../components/BackgroundsListField';
import EventsField from '../../components/EventsField';

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

  const onValueChange = useCallback((name: string, value: any) => {
    set(scene, name, value);
    onChange?.(scene);
  }, [onChange, scene]);

  const onBackgroundChange = useCallback(async (value: string) => {
    const img = new Image();

    img.onload = () => {
      if (scene.map && scene.sceneType !== 'logos') {
        scene.map.width = pixelToTile(img.width,
          scene.map.gridSize);
        scene.map.height = pixelToTile(img.height,
          scene.map.gridSize);
      }

      onValueChange('background', getGraphicName(value));
    };

    img.src = `project://graphics/${value}.bmp`;
  }, [scene, onValueChange]);

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

  return (
    <SceneFormContext.Provider value={getContext()}>
      <div className="p-3 w-full h-full overflow-x-hidden overflow-y-scroll">
        <Text size="1" className="text-slate">Scene</Text>
        <Heading
          contentEditable
          as="h2"
          size="4"
          className={classNames(
            'whitespace-nowrap overflow-scroll focus:outline-2',
            'outline-(--accent-9) rounded-xs',
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
            <Text className="block text-slate" size="1">Scene type</Text>
            <Select.Root
              value={scene?.sceneType ?? 'logos'}
              onValueChange={onValueChange.bind(null, 'sceneType')}
            >
              <Select.Trigger className="w-full" />
              <Select.Content>
                <Select.Item value="logos">Logos</Select.Item>
                <Select.Item value="2d-top-down">Top Down 2D</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>
          <div className="flex flex-col gap-2">
            <Text className="block text-slate" size="1">Background</Text>
            <BackgroundsListField
              value={scene?.background ?? ''}
              onValueChange={onBackgroundChange}
            />
          </div>
        </div>
        <Inset side="x"><Separator className="!w-full my-4" /></Inset>
        <div className="flex flex-col gap-4 pb-10">
          <div className="flex flex-col gap-2">
            <Text className="block text-slate" size="1">Events</Text>
            <Inset className="!rounded-none !overflow-visible">
              <Tabs.Root defaultValue="init">
                <Tabs.List size="1" className="px-1">
                  <Tabs.Trigger value="init">
                    On Init
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
    </SceneFormContext.Provider>
  );
};

export default SceneForm;
