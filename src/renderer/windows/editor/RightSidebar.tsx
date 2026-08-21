import { useCallback, useMemo } from 'react';
import { classNames } from '@junipero/react';
import { Card } from '@radix-ui/themes';
import { type ResizableProps, Resizable } from 're-resizable';
import { useHotkeys } from 'react-hotkeys-hook';

import { useEditor, useLocalData } from '../../services/hooks';

export interface RightSidebarProps extends ResizableProps {}

const RightSidebar = ({
  className,
  children,
  ...rest
}: RightSidebarProps) => {
  const { hasBottomBar } = useEditor();
  const { getSize, setSize, isCollapsed, collapse } = useLocalData();
  const rightSidebarWidth = useMemo(() => getSize('rightSidebarWidth', 300), [getSize]);
  const bottomBarHeight = useMemo(() => getSize('bottomBarHeight', 300), [getSize]);

  useHotkeys('mod+right', () => {
    collapse('rightSidebar');
  }, [collapse]);

  const onResize = useCallback((
    _: any, // don't care, MouseEvent
    __: any, // re-resizable not-exported Direction type
    ref: HTMLElement
  ) => {
    setSize('rightSidebarWidth', ref.offsetWidth);
  }, [setSize]);

  return (
    <Resizable
      defaultSize={{ width: rightSidebarWidth ?? 300 }}
      onResize={onResize}
      onResizeStart={onResize}
      onResizeStop={onResize}
      maxWidth="40vw"
      minWidth={200}
      { ...rest }
      className={classNames(
        'flex-none pointer-events-auto',
        { '!hidden': isCollapsed('rightSidebar') },
        className,
      )}
      style={{
        ...!isCollapsed('bottomBar') && hasBottomBar && {
          paddingBottom: bottomBarHeight,
        },
      }}
    >
      <Card
        className={classNames(
          'w-full h-full bg-seashell dark:bg-onyx !p-0',
          'before:!rounded-none after:!rounded-none !rounded-none',
        )}
      >
        { children }
      </Card>
    </Resizable>
  );
};

export default RightSidebar;
