import type { ComponentPropsWithoutRef, FC } from 'react';
import { classNames } from '@junipero/react';
import { Card, IconButton, Kbd, Text, Tooltip } from '@radix-ui/themes';
import { useHotkeys } from 'react-hotkeys-hook';

import type { CollisionBrush } from '../../../types';
import { useCanvas } from '../../services/hooks';
import CollisionIcon from '../../components/CollisionIcon';
import SlopeLeftIcon from '../../components/SlopeLeftIcon';
import SlopeRightIcon from '../../components/SlopeRightIcon';

const BRUSHES: {
  brush: CollisionBrush;
  label: string;
  shortcut: string;
  icon: FC<ComponentPropsWithoutRef<'svg'> & { active: boolean }>;
}[] = [
  {
    brush: 'normal',
    label: 'Collision',
    shortcut: '1',
    icon: CollisionIcon,
  },
  {
    brush: 'slope-left',
    label: 'Left slope',
    shortcut: '2',
    icon: SlopeLeftIcon,
  },
  {
    brush: 'slope-right',
    label: 'Right slope',
    shortcut: '3',
    icon: SlopeRightIcon,
  },
];

const CollisionsToolbar = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Card>) => {
  const { tool, collisionBrush, setCollisionBrush } = useCanvas();

  useHotkeys('1', () => setCollisionBrush?.('normal'),
    { enabled: tool === 'collisions' }, [tool, setCollisionBrush]);
  useHotkeys('2', () => setCollisionBrush?.('slope-left'),
    { enabled: tool === 'collisions' }, [tool, setCollisionBrush]);
  useHotkeys('3', () => setCollisionBrush?.('slope-right'),
    { enabled: tool === 'collisions' }, [tool, setCollisionBrush]);

  if (tool !== 'collisions') {
    return null;
  }

  return (
    <Card
      size="2"
      className={classNames(
        'flex! items-center !bg-seashell dark:!bg-onyx !p-2 gap-1.5',
        className,
      )}
      { ...props }
    >
      { BRUSHES.map(({ brush, label, shortcut, icon: Icon }) => (
        <IconButton
          key={brush}
          className="!m-0"
          size="1"
          variant={collisionBrush === brush ? 'solid' : 'ghost'}
          onClick={() => setCollisionBrush?.(brush)}
        >
          <Tooltip
            content={(
              <span className="flex items-center gap-2">
                <Text>{ label }</Text>
                <Kbd>{ shortcut }</Kbd>
              </span>
            )}
          >
            <Icon
              width={16}
              height={16}
              active={collisionBrush === brush}
            />
          </Tooltip>
        </IconButton>
      )) }
    </Card>
  );
};

export default CollisionsToolbar;
