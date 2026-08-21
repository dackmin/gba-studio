import { useCallback } from 'react';
import { Heading, Inset, Separator, Text } from '@radix-ui/themes';
import { classNames, set } from '@junipero/react';

import type { GameScene, GamePlayer } from '../../../types';
import { useCanvas } from '../../services/hooks';
import SpritesListField from '../../components/SpritesListField';
import EventValueField from '../../components/EventValueField';
import DirectionField from '../../components/DirectionField';

export interface PlayerFormProps {
  player: GamePlayer;
  onChange?: (scene?: GameScene) => void;
}

const PlayerForm = ({
  player,
  onChange,
}: PlayerFormProps) => {
  const { selectedScene } = useCanvas();

  const onValueChange = useCallback((name: string, value: any) => {
    set(player, name, value);
    onChange?.(selectedScene);
  }, [onChange, player, selectedScene]);

  return (
    <div className="p-3 w-full h-full overflow-x-hidden overflow-y-scroll">
      <Text size="1" className="text-slate">Actor</Text>
      <Heading
        as="h2"
        size="4"
        className={classNames(
          'whitespace-nowrap overflow-scroll focus:outline-2',
          'outline-(--accent-9) rounded-xs editable',
        )}
      >
        Player
      </Heading>
      <Inset side="x"><Separator className="!w-full my-4" /></Inset>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Text className="block text-slate" size="1">Sprite image</Text>
          <SpritesListField
            value={player.sprite ?? ''}
            onValueChange={onValueChange.bind(null, 'sprite')}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-2">
              <Text size="1" className="text-slate">Start X</Text>
              <EventValueField
                type="number"
                value={player.x}
                onValueChange={onValueChange.bind(null, 'x')}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Text size="1" className="text-slate">Start Y</Text>
              <EventValueField
                type="number"
                value={player.y}
                onValueChange={onValueChange.bind(null, 'y')}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Text size="1" className="text-slate">Direction</Text>
              <DirectionField
                value={player.direction ?? 'down'}
                onValueChange={onValueChange.bind(null, 'direction')}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Text className="block text-slate" size="1">
            Drawing priority
          </Text>
          <EventValueField
            type="number"
            min={-32767}
            max={32767}
            value={player?.z ?? 2}
            onValueChange={onValueChange.bind(null, 'z')}
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerForm;
