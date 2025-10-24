import type { ComponentPropsWithoutRef } from 'react';
import { classNames } from '@junipero/react';

import { useEditor } from '../../services/hooks';

const ConstrainedView = ({
  className,
  ...rest
}: ComponentPropsWithoutRef<'div'>) => {
  const { leftSidebarOpened, leftSidebarWidth } = useEditor();

  return (
    <div
      { ...rest }
      className={classNames(
        'w-screen h-screen relative',
        className,
      )}
      style={{
        ...(leftSidebarOpened ? { paddingLeft: leftSidebarWidth } : {}),
      }}
    />
  );
};

export default ConstrainedView;
