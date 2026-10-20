import { useCallback, useMemo } from 'react';
import { Select, Switch, Text, TextField } from '@radix-ui/themes';
import { set } from '@junipero/react';

import type { ShootProjectileEvent } from '../../../types';
import { useApp } from '../../services/hooks';
import { findSprite } from '../../../helpers';
import ActorListField from '../ActorListField';
import SpritesListField from '../SpritesListField';
import AnimationsListField from '../AnimationsListField';
import CollisionGroupField from '../CollisionGroupField';
import EventValueField, {
  EXCLUDE_ALL_EXCEPT_VALUE_AND_VARIABLES,
} from '../EventValueField';
import DirectionField from '../DirectionField';

export interface EventShootProjectileProps {
  event: ShootProjectileEvent;
  onValueChange?: (
    event: ShootProjectileEvent,
  ) => void;
}

const EventShootProjectile = ({
  event,
  onValueChange,
}: EventShootProjectileProps) => {
  const { sprites } = useApp();

  const onValueChange_ = useCallback((name: string, value: any) => {
    set(event, name, value);
    onValueChange?.(event);
  }, [onValueChange, event]);

  const sprite = useMemo(() => (
    findSprite(sprites, event?.sprite)
  ), [sprites, event?.sprite]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Source</Text>
        <Select.Root
          value={event.sourceType ?? ''}
          onValueChange={onValueChange_.bind(null, 'sourceType')}
        >
          <Select.Trigger placeholder="Select source" />
          <Select.Content>
            <Select.Item value="actor">Actor</Select.Item>
            <Select.Item value="player">Player</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
      { event.sourceType === 'actor' && (
        <div className="flex flex-col gap-2">
          <Text size="1" className="text-slate">Actor</Text>
          <ActorListField
            value={event.actor ?? ''}
            onValueChange={onValueChange_.bind(null, 'actor')}
          />
        </div>
      ) }
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Sprite</Text>
        <SpritesListField
          value={event.sprite ?? ''}
          onValueChange={onValueChange_.bind(null, 'sprite')}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Animation</Text>
        <AnimationsListField
          sprite={sprite}
          value={event.animation || ''}
          onValueChange={onValueChange_.bind(null, 'animation')}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Collision group</Text>
        <CollisionGroupField
          value={event.collisionGroup ?? 0}
          onValueChange={onValueChange_.bind(null, 'collisionGroup')}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Speed</Text>
        <EventValueField
          excludeTypes={EXCLUDE_ALL_EXCEPT_VALUE_AND_VARIABLES}
          value={event.speed ?? 3}
          onValueChange={onValueChange_.bind(null, 'speed')}
        >
          <TextField.Slot side="right">
            px/s
          </TextField.Slot>
        </EventValueField>
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Direction</Text>
        <DirectionField
          value={event.direction ?? 'right'}
          exclude={[
            ...(event.sourceType === 'player' ? ['towards_player'] : []),
            ...(event.sourceType === 'actor' ? ['from_player'] : []),
          ]}
          onValueChange={onValueChange_.bind(null, 'direction')}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Lifetime</Text>
        <EventValueField
          excludeTypes={EXCLUDE_ALL_EXCEPT_VALUE_AND_VARIABLES}
          value={event.lifetime ?? 120}
          onValueChange={onValueChange_.bind(null, 'lifetime')}
        >
          <TextField.Slot side="right">
            frames
          </TextField.Slot>
        </EventValueField>
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Destroy on collision</Text>
        <Switch
          checked={event.destroyOnCollision ?? false}
          onCheckedChange={onValueChange_.bind(null, 'destroyOnCollision')}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Reacts to Gravity (side-scroller only)</Text>
        <Switch
          checked={event.hasGravity ?? false}
          onCheckedChange={onValueChange_.bind(null, 'hasGravity')}
        />
      </div>
      { event.hasGravity && (
        <div className="flex flex-col gap-2">
          <Text size="1" className="text-slate">Gravity style</Text>
          <Select.Root
            value={event.gravityStyle ?? 'arc'}
            onValueChange={onValueChange_.bind(null, 'gravityStyle')}
          >
            <Select.Trigger placeholder="Select" />
            <Select.Content>
              <Select.Item value="normal">Normal</Select.Item>
              <Select.Item value="arc">Arc</Select.Item>
              <Select.Item value="sinus">Sinus (like mario&apos;s fireball)</Select.Item>
              <Select.Item value="custom">Custom</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>
      ) }
      { event.hasGravity && event.gravityStyle === 'custom' && (
        <>
          <div className="flex flex-col gap-2">
            <Text size="1" className="text-slate">Gravity strength</Text>
            <EventValueField
              excludeTypes={EXCLUDE_ALL_EXCEPT_VALUE_AND_VARIABLES}
              value={event.gravity ?? 1}
              onValueChange={onValueChange_.bind(null, 'gravity')}
            >
              <TextField.Slot side="right">
                px/s²
              </TextField.Slot>
            </EventValueField>
          </div>
          <div className="flex flex-col gap-2">
            <Text size="1" className="text-slate">Gravity direction</Text>
            <EventValueField
              excludeTypes={EXCLUDE_ALL_EXCEPT_VALUE_AND_VARIABLES}
              value={event.gravityAngle ?? 90}
              onValueChange={onValueChange_.bind(null, 'gravityAngle')}
            >
              <TextField.Slot side="right">
                degrees
              </TextField.Slot>
            </EventValueField>
          </div>
          <div className="flex flex-col gap-2">
            <Text size="1" className="text-slate">Terminal velocity</Text>
            <EventValueField
              excludeTypes={EXCLUDE_ALL_EXCEPT_VALUE_AND_VARIABLES}
              value={event.terminalVelocity ?? 100}
              onValueChange={onValueChange_.bind(null, 'terminalVelocity')}
            >
              <TextField.Slot side="right">
                px/s
              </TextField.Slot>
            </EventValueField>
          </div>
        </>
      ) }
    </div>
  );
};

export default EventShootProjectile;
