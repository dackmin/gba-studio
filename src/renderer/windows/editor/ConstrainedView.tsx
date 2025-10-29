import type { ComponentPropsWithoutRef } from 'react';
import { classNames } from '@junipero/react';

import { useEditor } from '../../services/hooks';

const ConstrainedView = ({
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<'div'>) => {
  const { leftSidebarOpened, leftSidebarWidth } = useEditor();

  return (
    <div
      { ...rest }
      className={classNames(
        'w-screen h-screen relative pt-14',
        className,
      )}
      style={{
        ...(leftSidebarOpened ? { paddingLeft: leftSidebarWidth } : {}),
      }}
    >
      <div className="px-2">
        { children }
      </div>
    </div>
  );
};

export default ConstrainedView;
