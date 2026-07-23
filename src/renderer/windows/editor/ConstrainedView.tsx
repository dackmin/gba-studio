import { ScrollArea, ScrollAreaProps } from '@radix-ui/themes';
import { classNames } from '@junipero/react';

import { useEditor } from '../../services/hooks';

const ConstrainedView = ({
  className,
  children,
  ...rest
}: ScrollAreaProps) => {
  const { leftSidebarOpened, leftSidebarWidth, bottomBarOpened, bottomBarHeight } = useEditor();

  return (
    <ScrollArea
      { ...rest }
      className={classNames(
        'w-screen relative pt-14',
        className,
      )}
      style={{
        ...(leftSidebarOpened ? { paddingLeft: leftSidebarWidth } : {}),
        height: `calc(100vh - ${bottomBarOpened ? bottomBarHeight : 0}px)`,
      }}
    >
      <div className="px-2 min-h-full flex flex-col">
        { children }
      </div>
    </ScrollArea>
  );
};

export default ConstrainedView;
