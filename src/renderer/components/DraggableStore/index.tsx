import { type ComponentPropsWithoutRef, useCallback, useState } from 'react';

import { type DraggableContextType, DraggableContext } from '../../services/contexts';

const DraggableStore = ({ children }: ComponentPropsWithoutRef<any>) => {
  const [data, setData] = useState(undefined);

  const getContext = useCallback((): DraggableContextType => ({
    data,
    setData,
  }), [data, setData]);

  return (
    <DraggableContext value={getContext()}>
      { children }
    </DraggableContext>
  );
};

export default DraggableStore;
