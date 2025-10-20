import { classNames } from '@junipero/react';
import { Card } from '@radix-ui/themes';
import { type ResizableProps, Resizable } from 're-resizable';

export interface RightSidebarProps extends ResizableProps {}

const RightSidebar = ({
  className,
  children,
  ...rest
}: RightSidebarProps) => {
  return (
    <Resizable
      defaultSize={{ width: 300 }}
      maxWidth="40%"
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
