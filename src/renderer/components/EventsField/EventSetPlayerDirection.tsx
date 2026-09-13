import { useCallback } from 'react';
import { set } from '@junipero/react';
import { Text } from '@radix-ui/themes';

import type {
  SetPlayerDirectionEvent,
} from '../../../types';
import DirectionField from '../DirectionField';

export interface EventSetPlayerDirectionProps {
  event: SetPlayerDirectionEvent;
  onValueChange?: (
    event: SetPlayerDirectionEvent,
  ) => void;
}

const EventSetPlayerDirection = ({
  event,
  onValueChange,
}: EventSetPlayerDirectionProps) => {
  const onValueChange_ = useCallback((name: string, value: any) => {
    set(event, name, value);
    onValueChange?.(event);
  }, [onValueChange, event]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Direction</Text>
        <DirectionField
          value={event.direction ?? 'down'}
          onValueChange={onValueChange_.bind(null, 'direction')}
        />
      </div>
    </div>
  );
};

export default EventSetPlayerDirection;
