import { useCallback } from 'react';
import { classNames } from '@junipero/react';
import { type ResizableProps, Resizable } from 're-resizable';
import { Card } from '@radix-ui/themes';

import { useEditor } from '../../services/hooks';

export interface BottomBarProps extends ResizableProps {}

const BottomBar = ({
  className,
  children,
  ...rest
}: BottomBarProps) => {
  const {
    bottomBarOpened,
    bottomBarHeight,
    setBottomBarHeight,
  } = useEditor();

  const onResize = useCallback((
    _: any, // don't care, MouseEvent
    __: any, // re-resizable not-exported Direction type
    ref: HTMLElement
  ) => {
    setBottomBarHeight(ref.offsetHeight);
  }, [setBottomBarHeight]);

  return (
    <Resizable
      defaultSize={{ height: bottomBarHeight ?? 300 }}
      onResize={onResize}
      onResizeStart={onResize}
      onResizeStop={onResize}
      enable={{ top: true }}
      maxHeight="40vh"
      minHeight={100}
      { ...rest }
      className={classNames(
        'flex-none pointer-events-auto !w-screen relative',
        'transition-[margin-left] duration-100 !fixed bottom-0 left-0',
        { '!hidden': !bottomBarOpened },
        className,
      )}
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

export default BottomBar;
