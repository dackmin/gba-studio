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
import {
  Card,
  IconButton,
  Inset,
  Kbd,
  ScrollArea,
  Select,
  Tabs,
  Text,
  Tooltip,
} from '@radix-ui/themes';
import { type ResizableProps, Resizable } from 're-resizable';
import { useHotkeys } from 'react-hotkeys-hook';

import { useApp, useCanvas, useEditor } from '../../services/hooks';
import views from '../../views';

export interface LeftSidebarProps extends ResizableProps {}

const LeftSidebar = ({
  className,
  children,
  ...rest
}: LeftSidebarProps) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const {
    projectPath,
    building,
    project,
    scenes,
    variables,
    scripts,
    editorConfig,
    setBuilding,
    setEditorConfig,
  } = useApp();
  const {
    view,
    leftSidebarOpened,
    leftSidebarWidth,
    tileX,
    tileY,
    setView,
    toggleLeftSidebar,
    setLeftSidebarWidth,
  } = useEditor();
  const { selectedScene } = useCanvas();

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
    await window.electron.startBuildProject(projectPath, {
      project: {
        ...project,
        startingScene: selectedScene
          ? selectedScene.id
          : project?.startingScene,
      },
      scenes,
      variables,
      scripts,
    });
  }, [
    building, selectedScene, projectPath, project, scenes, variables, scripts,
    setBuilding,
  ]);

  useHotkeys('mod+enter', onToggleBuild, [onToggleBuild]);

  const onTabChange = useCallback((newView: string) => {
    setView(newView);
  }, [setView]);

  const onResize = useCallback((
    _: any, // don't care, MouseEvent
    __: any, // re-resizable not-exported Direction type
    ref: HTMLElement
  ) => {
    setLeftSidebarWidth(ref.offsetWidth);
  }, [setLeftSidebarWidth]);

  const onBuildConfigChange = useCallback((value: string) => {
    setEditorConfig({
      ...editorConfig,
      buildConfiguration: value || undefined,
    });
  }, [editorConfig, setEditorConfig]);

  return (
    <>
      <div
        className={classNames(
          'fixed left-0 top-[15px] h-[32px] flex',
          'z-2000 gap-8 items-center w-full pr-4 justify-between !app-no-drag',
          'pointer-events-auto transition-[padding-left] duration-100',
          {
            'pl-[100px]': !isFullScreen && window.electron.isDarwin,
            'pl-6': isFullScreen || !window.electron.isDarwin,
          },
        )}
        style={{ width: leftSidebarOpened ? leftSidebarWidth : 'auto' }}
      >
        <IconButton variant="ghost" radius="full" onClick={toggleLeftSidebar}>
          <ListBulletIcon
            width={20}
            height={20}
            className="dark:[&_path]:fill-seashell"
          />
        </IconButton>
        <div className="flex items-center gap-2">
          { (project?.configurations?.length || 0) > 0 && (
            <Select.Root
              size="1"
              value={editorConfig?.buildConfiguration || ''}
              onValueChange={onBuildConfigChange}
            >
              <Select.Trigger placeholder="Default" />
              <Select.Content>
                <Select.Group>
                  <Select.Label>
                    <Text size="1">Build Configuration</Text>
                  </Select.Label>
                  <Select.Item value="default">
                    Default
                  </Select.Item>
                  { project?.configurations?.map(config => (
                    <Select.Item key={config.id} value={config.id}>
                      { config.name || 'Unnamed' }
                    </Select.Item>
                  )) }
                </Select.Group>
              </Select.Content>
            </Select.Root>
          ) }
          <Tooltip
            side="bottom"
            content={(
              <span className="flex items-center gap-2">
                <Text>Build project</Text>
                <Kbd>
                  { window.electron.isDarwin ? '⌘' : 'Ctrl' }
                  + Enter
                </Kbd>
              </span>
            )}
          >
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
          </Tooltip>
        </div>
      </div>
      <Resizable
        defaultSize={{ width: 300 }}
        onResize={onResize}
        onResizeStart={onResize}
        onResizeStop={onResize}
        maxWidth="40vw"
        minWidth={200}
        { ...rest }
        className={classNames(
          'flex-none pointer-events-auto h-full relative',
          'transition-[margin-left] duration-100',
          className,
        )}
        style={{
          marginLeft: -(leftSidebarOpened ? 0 : leftSidebarWidth),
        }}
      >
        <div className="p-2 pr-0 w-full h-full relative">
          <Card
            className={classNames(
              'w-full h-full bg-seashell dark:bg-onyx z-10',
              'before:!rounded-[26px] after:!rounded-[26px] !rounded-[26px]',
              '!pt-12 !pb-0'
            )}
          >
            <Inset side="x" className="h-full flex flex-col">
              <Tabs.Root
                value={view}
                className="flex-auto overflow-y-hidden overflow-x-visible"
                onValueChange={onTabChange}
              >
                <div
                  className="h-full flex flex-col overflow-hidden"
                >
                  <Tabs.List className="flex-none">
                    { views.map(({ name, title, icon: Icon }) => (
                      <Tabs.Trigger key={name} value={name || ''}>
                        <Tooltip side="bottom" content={title}>
                          { Icon ? <Icon /> : <Text>Unknown</Text> }
                        </Tooltip>
                      </Tabs.Trigger>
                    )) }
                  </Tabs.List>
                  <ScrollArea className="!w-full !flex-auto">
                    { children }
                  </ScrollArea>
                </div>
              </Tabs.Root>
              <div
                className={classNames(
                  'bg-gondola flex-none h-8 flex items-center justify-center',
                )}
              >
                <Text size="1" className="text-slate">
                  { (tileX ?? -1) >= 0 && (tileY ?? -1) >= 0
                    ? `Tile: (${tileX}, ${tileY})`
                    : 'Tile: —' }
                </Text>
              </div>
            </Inset>
          </Card>
        </div>
      </Resizable>
    </>
  );
};

export default LeftSidebar;
