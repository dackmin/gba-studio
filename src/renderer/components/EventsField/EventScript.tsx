import { useCallback } from 'react';
import { set } from '@junipero/react';
import { Select, Text } from '@radix-ui/themes';

import type {
  ExecuteScriptEvent,
} from '../../../types';
import { useApp } from '../../services/hooks';

export interface EventScriptProps {
  event: ExecuteScriptEvent;
  onValueChange?: (
    event: ExecuteScriptEvent,
  ) => void;
}

const EventScript = ({
  event,
  onValueChange,
}: EventScriptProps) => {
  const { scripts } = useApp();

  const onValueChange_ = useCallback((name: string, value: any) => {
    set(event, name, value);
    onValueChange?.(event);
  }, [onValueChange, event]);

  return (
    <div className="flex flex-col gap-2">
      <Text size="1" className="text-slate">Script</Text>
      <Select.Root
        value={event.script || ''}
        onValueChange={onValueChange_.bind(null, 'script')}
      >
        <Select.Trigger placeholder="Select" />
        <Select.Content>
          { scripts.map(script => (
            <Select.Item key={script.id} value={script.id}>
              { script.name }
            </Select.Item>
          )) }
        </Select.Content>
      </Select.Root>
    </div>
  );
};

export default EventScript;
