import { useCallback, useEffect, useState } from 'react';
import { classNames, useEventListener } from '@junipero/react';
import { ListBulletIcon, PlayIcon } from '@radix-ui/react-icons';
import { Card, IconButton } from '@radix-ui/themes';
import { Resizable, ResizableProps } from 're-resizable';

export interface ProjectSidebarProps extends ResizableProps {}

const ProjectSidebar = ({
  className,
  ...rest
}: ProjectSidebarProps) => {
  const [opened, setOpened] = useState(true);
  const [width, setWidth] = useState(300);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const checkFullscreen = useCallback(async () => {
    setIsFullScreen(await window.electron.isFullscreen());
  }, []);

  useEventListener('resize', () => {
    checkFullscreen();
  }, [checkFullscreen]);

  useEffect(() => {
    checkFullscreen();
  }, [checkFullscreen]);

  const toggle = () => {
    setOpened(o => !o);
  };

  return (
    <>
      <div
        className={classNames(
          'fixed left-0 top-[15px] h-[32px] flex',
          'z-2000 gap-8 items-center w-full pr-4 justify-between !app-no-drag',
          'pointer-events-auto transition-padding duration-100',
          {
            'pl-[100px]': !isFullScreen,
            'pl-6': isFullScreen,
          },
        )}
        style={{ width: opened ? width : 'auto' }}
      >
        <IconButton variant="ghost" radius="full" onClick={toggle}>
          <ListBulletIcon
            width={20}
            height={20}
            className="dark:[&_path]:fill-seashell"
          />
        </IconButton>
        <div className="flex items-center gap-2">
          <IconButton variant="ghost" radius="full">
            <PlayIcon
              width={20}
              height={20}
              className="dark:[&_path]:fill-seashell"
            />
          </IconButton>
        </div>
      </div>
      <div
        className={classNames(
          'flex-none h-full relative',
          { 'w-0 overflow-hidden': !opened },
        )}
      >
        <Resizable
          defaultSize={{ width: 300 }}
          onResize={(_, __, ref) => setWidth(ref.offsetWidth)}
          onResizeStart={(_, __, ref) => setWidth(ref.offsetWidth)}
          onResizeStop={(_, __, ref) => setWidth(ref.offsetWidth)}
          maxWidth="40vw"
          minWidth={200}
          { ...rest }
          className={classNames(
            'flex-none pointer-events-auto duration-100 !h-full fixed',
            'left-0 top-0 bottom-0',
            className,
          )}
        >
          <div className="p-2 pr-0 w-full h-full relative">
            <Card
              className={classNames(
                'w-full h-full bg-seashell dark:bg-onyx z-10',
                'before:!rounded-[26px] after:!rounded-[26px] !rounded-[26px]',
              )}
            >
            </Card>
          </div>
        </Resizable>
      </div>
    </>
  );
};

export default ProjectSidebar;
