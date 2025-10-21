import { useCallback } from 'react';
import { classNames } from '@junipero/react';
import { Card } from '@radix-ui/themes';
import { type ResizableProps, Resizable } from 're-resizable';

import { useEditor } from '../../services/hooks';

export interface RightSidebarProps extends ResizableProps {}

const RightSidebar = ({
  className,
  children,
  ...rest
}: RightSidebarProps) => {
  const { setRightSidebarWidth } = useEditor();

  const onResize = useCallback((
    _: any, // don't care, MouseEvent
    __: any, // re-resizable not-exported Direction type
    ref: HTMLElement
  ) => {
    setRightSidebarWidth(ref.offsetWidth);
  }, [setRightSidebarWidth]);

  return (
    <Resizable
      defaultSize={{ width: 300 }}
      onResize={onResize}
      onResizeStart={onResize}
      onResizeStop={onResize}
      maxWidth="40vw"
      minWidth={200}
      { ...rest }
      className={classNames(
        'flex-none pointer-events-auto',
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

export default RightSidebar;
