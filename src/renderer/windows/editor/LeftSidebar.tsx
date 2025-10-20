import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import { classNames, useEventListener } from '@junipero/react';
import {
  ListBulletIcon,
  PlayIcon,
  StopIcon,
} from '@radix-ui/react-icons';
import { Card, IconButton, Inset, ScrollArea, Tabs, Tooltip } from '@radix-ui/themes';
import { type ResizableProps, Resizable } from 're-resizable';

import { useApp, useEditor } from '../../services/hooks';
import views from '../../views';

export interface LeftSidebarProps extends ResizableProps {}

const LeftSidebar = ({
  className,
  children,
  ...rest
}: LeftSidebarProps) => {
  const [width, setWidth] = useState(300);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { projectPath, building, setBuilding } = useApp();
  const { view, setView, leftSidebarOpened, toggleLeftSidebar } = useEditor();

  const checkFullscreen = useCallback(async () => {
    setIsFullScreen(await window.electron.isFullscreen());
  }, []);

  useEventListener('resize', () => {
    checkFullscreen();
  }, [checkFullscreen]);

  useEffect(() => {
    checkFullscreen();
  }, [checkFullscreen]);

  const onToggleBuild = useCallback(async () => {
    if (building) {
      await window.electron.abortBuildProject();

      return;
    }

    setBuilding(true);
    await window.electron.startBuildProject(projectPath);
  }, [building, setBuilding]);

  const onTabChange = useCallback((newView: string) => {
    setView(newView);
  }, [setView]);

  return (
    <>
      <div
        className={classNames(
          'fixed left-0 top-[15px] h-[32px] flex',
          'z-2000 gap-8 items-center w-full pr-4 justify-between !app-no-drag',
          'pointer-events-auto transition-[padding-left] duration-100',
          {
            'pl-[100px]': !isFullScreen,
            'pl-6': isFullScreen,
          },
        )}
        style={{ width: leftSidebarOpened ? width : 'auto' }}
      >
        <IconButton variant="ghost" radius="full" onClick={toggleLeftSidebar}>
          <ListBulletIcon
            width={20}
            height={20}
            className="dark:[&_path]:fill-seashell"
          />
        </IconButton>
        <div className="flex items-center gap-2">
          <IconButton variant="ghost" radius="full" onClick={onToggleBuild}>
            { building ? (
              <StopIcon
                width={20}
                height={20}
                className="dark:[&_path]:fill-seashell"
              />
            ) : (
              <PlayIcon
                width={20}
                height={20}
                className="dark:[&_path]:fill-seashell"
              />
            ) }
          </IconButton>
        </div>
      </div>
      <Resizable
        defaultSize={{ width: 300 }}
        onResize={(_, __, ref) => setWidth(ref.offsetWidth)}
        onResizeStart={(_, __, ref) => setWidth(ref.offsetWidth)}
        onResizeStop={(_, __, ref) => setWidth(ref.offsetWidth)}
        maxWidth="40vw"
        minWidth={200}
        { ...rest }
        className={classNames(
          'flex-none pointer-events-auto h-full relative',
          'transition-[margin-left] duration-100',
          className,
        )}
        style={{
          marginLeft: -(leftSidebarOpened ? 0 : (width * 1)),
        }}
      >
        <div className="p-2 pr-0 w-full h-full relative">
          <Card
            className={classNames(
              'w-full h-full bg-seashell dark:bg-onyx z-10',
              'before:!rounded-[26px] after:!rounded-[26px] !rounded-[26px]',
              '!pt-12'
            )}
          >
            <Tabs.Root
              value={view}
              className="h-full flex flex-col"
              onValueChange={onTabChange}
            >
              <Inset side="all">
                <Tabs.List>
                  { views.map(({ name, title, icon: Icon }) => (
                    <Tabs.Trigger key={name} value={name}>
                      <Tooltip side="bottom" content={title}>
                        <Icon />
                      </Tooltip>
                    </Tabs.Trigger>
                  )) }
                </Tabs.List>
                <ScrollArea>
                  { children }
                </ScrollArea>
              </Inset>
            </Tabs.Root>
          </Card>
        </div>
      </Resizable>
    </>
  );
};

export default LeftSidebar;
