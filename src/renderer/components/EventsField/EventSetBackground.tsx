import { useCallback } from 'react';
import { set } from '@junipero/react';
import { Text } from '@radix-ui/themes';

import type { SetBackgroundEvent } from '../../../types';
import BackgroundsListField from '../BackgroundsListField';

export interface EventSetBackgroundProps {
  event: SetBackgroundEvent;
  onValueChange?: (
    event: SetBackgroundEvent,
  ) => void;
}

const EventSetBackground = ({
  event,
  onValueChange,
}: EventSetBackgroundProps) => {
  const onValueChange_ = useCallback((name: string, value: any) => {
    set(event, name, value);
    onValueChange?.(event);
  }, [onValueChange, event]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text size="1" className="text-slate">Background</Text>
        <BackgroundsListField
          value={event.background ?? 'bg_default'}
          onValueChange={onValueChange_.bind(null, 'background')}
        />
      </div>
    </div>
  );
};

export default EventSetBackground;
