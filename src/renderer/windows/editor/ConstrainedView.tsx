import { useMemo } from 'react';
import { ScrollArea, ScrollAreaProps } from '@radix-ui/themes';
import { classNames } from '@junipero/react';

import { useEditor, useLocalData } from '../../services/hooks';

const ConstrainedView = ({
  className,
  children,
  ...rest
}: ScrollAreaProps) => {
  const { getSize, isCollapsed } = useLocalData();
  const { resizingSidebar } = useEditor();
  const leftSidebarWidth = useMemo(() => getSize('leftSidebarWidth', 300), [getSize]);
  const bottomBarHeight = useMemo(() => getSize('bottomBarHeight', 300), [getSize]);

  return (
    <ScrollArea
      { ...rest }
      className={classNames(
        'w-screen relative pt-14',
        {
          'transition-[padding-left,height] duration-100': !resizingSidebar,
        },
        className,
      )}
      style={{
        ...( !isCollapsed('leftSidebar') ? { paddingLeft: leftSidebarWidth } : {}),
        height: `calc(100vh - ${!isCollapsed('bottomBar') ? bottomBarHeight : 0}px)`,
      }}
    >
      <div className="px-2 min-h-full flex flex-col">
        { children }
      </div>
    </ScrollArea>
  );
};

export default ConstrainedView;
