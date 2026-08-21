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
  const { hasBottomBar, resizingSidebar, setResizingSidebar } = useEditor();
  const { getSize, setSize, isCollapsed, collapse } = useLocalData();
  const rightSidebarWidth = useMemo(() => getSize('rightSidebarWidth', 300), [getSize]);
  const bottomBarHeight = useMemo(() => getSize('bottomBarHeight', 300), [getSize]);

  useHotkeys('mod+right', () => {
    collapse('rightSidebar');
  }, [collapse]);

  const onResize = useCallback((
    _: any, // don't care, MouseEvent
    __: any, // don't care, re-resizable not-exported Direction type
    ref: HTMLElement
  ) => {
    setSize('rightSidebarWidth', ref.offsetWidth);
  }, [setSize]);

  const onResizeStart = useCallback((
    _: any, // don't care, MouseEvent
    __: any, // don't care, re-resizable not-exported Direction type
    ref: HTMLElement
  ) => {
    setResizingSidebar(true);
    onResize(_, __, ref);
  }, [setResizingSidebar, onResize]);

  const onResizeStop = useCallback((
    _: any, // don't care, MouseEvent
    __: any, // don't care, re-resizable not-exported Direction type
    ref: HTMLElement
  ) => {
    setResizingSidebar(false);
    onResize(_, __, ref);
  }, [setResizingSidebar, onResize]);

  return (
    <div
      className={classNames(
        'flex-none h-full pointer-events-none',
        {
          'transition-[width] duration-100': !resizingSidebar,
        },
        className,
      )}
      style={{
        ...!resizingSidebar && { width: !isCollapsed('rightSidebar') ? rightSidebarWidth : 0 },
      }}
    >
      <Resizable
        defaultSize={{ width: rightSidebarWidth ?? 300 }}
        onResize={onResize}
        onResizeStart={onResizeStart}
        onResizeStop={onResizeStop}
        maxWidth="40vw"
        minWidth={200}
        enable={{ left: true }}
        { ...rest }
        className={classNames(
          'h-full! pointer-events-auto',
          {
            'transition-[padding-bottom,margin-right] duration-100': !resizingSidebar,
          }
        )}
        style={{
          marginRight: -(!isCollapsed('rightSidebar') ? 0 : rightSidebarWidth),
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
    </div>
  );
};

export default RightSidebar;
