import { ComponentPropsWithoutRef } from 'react';
import { classNames } from '@junipero/react';
import { Card, IconButton } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';

import { useEditor } from '../../services/hooks';

export interface TimeLineBarProps extends ComponentPropsWithoutRef<'div'> {
  className?: string;
}

const TimeLineBar = ({ className, ...props }: TimeLineBarProps) => {
  const { selectedAnimation } = useEditor();
  const {
    bottomBarOpened,
    bottomBarHeight,
    leftSidebarOpened,
    leftSidebarWidth,
    rightSidebarOpened,
    rightSidebarWidth,
  } = useEditor();

  return (
    <div
      className={classNames(
        '!fixed transform z-1000 w-full px-2',
        { 'bottom-8': !bottomBarOpened }
      )}
      style={{
        ...bottomBarOpened && { bottom: 32 /* bottom-8 */ + bottomBarHeight },
        ...(leftSidebarOpened || rightSidebarOpened) && {
          width: `calc(100% - ${
            (leftSidebarOpened ? leftSidebarWidth : 0) +
            (rightSidebarOpened ? rightSidebarWidth : 0)
          }px)`,
        },
        left: leftSidebarOpened ? leftSidebarWidth : 0,
      }}
    >
      <Card
        size="2"
        className={classNames(
          'flex items-center !bg-seashell dark:!bg-onyx !p-3',
          className
        )}
        { ...props }
      >
        <Card className="w-[45px] h-[45px] !p-0">
          <IconButton
            variant="ghost"
            className="!w-full !h-full"
            onClick={() => {}}
          >
            <PlusIcon />
          </IconButton>
        </Card>
      </Card>
    </div>
  );
};

export default TimeLineBar;
