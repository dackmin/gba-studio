import { classNames } from '@junipero/react';
import type { SceneEvent } from '../../../types';

export interface EventsFieldProps {
  value: SceneEvent[];
  onValueChange?: (events: SceneEvent[]) => void;
}

const EventsField = ({
  value,
  onValueChange,
}: EventsFieldProps) => {
  return (
    <div
      className={classNames(
        'flex flex-col gap-2',
      )}
    >
      { value.length === 0 ? (
        <div className="p-2 text-sm italic text-gray-500">No events</div>
      ) : (
        value.map((event, index) => (
          <div key={event.id || index}>
            <a href="#">{ event.type }</a>
            
      ) }
    </div>
  );
};

export default EventsField;
