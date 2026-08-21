import { useCallback, useMemo } from 'react';
import { classNames } from '@junipero/react';
import { type ResizableProps, Resizable } from 're-resizable';
import { Card } from '@radix-ui/themes';
import { useHotkeys } from 'react-hotkeys-hook';

import { useEditor, useLocalData } from '../../services/hooks';

export interface BottomBarProps extends ResizableProps {}

const BottomBar = ({
  className,
  children,
  ...rest
}: BottomBarProps) => {
  const { resizingSidebar, setResizingSidebar } = useEditor();
  const { getSize, setSize, collapse, isCollapsed } = useLocalData();
  const bottomBarHeight = useMemo(() => getSize('bottomBarHeight', 300), [getSize]);

  useHotkeys('mod+down', () => {
    collapse('bottomBar');
  }, [collapse]);

  const onResize = useCallback((
    _: any, // don't care, MouseEvent
    __: any, // re-resizable not-exported Direction type
    ref: HTMLElement
  ) => {
    setSize('bottomBarHeight', ref.offsetHeight);
  }, [setSize]);

  const onResizeStart = useCallback((
    _: any, // don't care, MouseEvent
    __: any, // re-resizable not-exported Direction type
    ref: HTMLElement
  ) => {
    setResizingSidebar(true);
    onResize(_, __, ref);
  }, [setResizingSidebar, onResize]);

  const onResizeStop = useCallback((
    _: any, // don't care, MouseEvent
    __: any, // re-resizable not-exported Direction type
    ref: HTMLElement
  ) => {
    setResizingSidebar(false);
    onResize(_, __, ref);
  }, [setResizingSidebar, onResize]);

  return (
    <div
      className={classNames(
        'w-screen fixed bottom-0 left-0 pointer-events-none',
        {
          'transition-[height] duration-100': !resizingSidebar,
        }
      )}
      style={{
        ...!resizingSidebar && { height: !isCollapsed('bottomBar') ? bottomBarHeight : 0 },
      }}
    >
      <Resizable
        defaultSize={{ height: bottomBarHeight ?? 300 }}
        onResize={onResize}
        onResizeStart={onResizeStart}
        onResizeStop={onResizeStop}
        enable={{ top: true }}
        maxHeight="40vh"
        minHeight={100}
        { ...rest }
        className={classNames(
          'flex-none pointer-events-auto !w-screen relative',
          {
            'transition-[margin-bottom] duration-100': !resizingSidebar,
          },
          className,
        )}
        style={{
          marginBottom: -(!isCollapsed('bottomBar') ? 0 : bottomBarHeight),
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

export default BottomBar;
