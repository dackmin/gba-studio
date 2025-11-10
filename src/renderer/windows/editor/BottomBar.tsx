import { useCallback, useReducer, useRef } from 'react';
import { classNames, mockState } from '@junipero/react';
import { type ResizableProps, Resizable } from 're-resizable';
import { Card, Tabs, ScrollArea } from '@radix-ui/themes';

import {
  type BottomBarContextType,
  BottomBarContext,
} from '../../services/contexts';
import { useEditor } from '../../services/hooks';
import BuildLogsTab from './BuildLogsTab';

export interface BottomBarProps extends ResizableProps {}

export interface BottomBarState {
  tab: string;
  manualScroll: boolean;
  scrolledToBottom: boolean;
}

const BottomBar = ({
  className,
  children,
  ...rest
}: BottomBarProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [state, dispatch] = useReducer(mockState<BottomBarState>, {
    tab: 'build',
    manualScroll: false,
    scrolledToBottom: true,
  });

  const {
    leftSidebarOpened,
    leftSidebarWidth,
    bottomBarOpened,
    setBottomBarHeight,
  } = useEditor();

  const onResize = useCallback((
    _: any, // don't care, MouseEvent
    __: any, // re-resizable not-exported Direction type
    ref: HTMLElement
  ) => {
    setBottomBarHeight(ref.offsetHeight);
  }, [setBottomBarHeight]);

  const setTab = useCallback((tab: string) => {
    dispatch({ tab });
  }, []);

  const isScrolledToBottom = useCallback(() => {
    if (!scrollAreaRef.current) {
      return false;
    }

    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;

    if (scrollHeight <= clientHeight) {
      return true;
    }

    return scrollTop + clientHeight >= scrollHeight - 10;
  }, []);

  const scrollToBottom = useCallback(() => {
    scrollAreaRef.current
      ?.scrollTo({ top: scrollAreaRef.current.scrollHeight });

    dispatch({ manualScroll: false, scrolledToBottom: isScrolledToBottom() });
  }, [isScrolledToBottom]);

  const onManualScroll = useCallback(() => {
    const scrolledToBottom = isScrolledToBottom();
    dispatch({
      manualScroll: !scrolledToBottom,
      scrolledToBottom,
    });
  }, [isScrolledToBottom]);

  const getContext = useCallback((): BottomBarContextType => ({
    manualScroll: state.manualScroll,
    scrolledToBottom: state.scrolledToBottom,
    scrollToBottom,
    isScrolledToBottom,
  }), [
    state.manualScroll, state.scrolledToBottom,
    scrollToBottom, isScrolledToBottom,
  ]);

  return (
    <BottomBarContext.Provider value={getContext()}>
      <Resizable
        defaultSize={{ height: 300 }}
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
          <Tabs.Root
            className="h-full !flex flex-col"
            value={state.tab}
            onValueChange={setTab}
          >
            <Tabs.List
              className="flex-none"
              style={{
                ...leftSidebarOpened && { paddingLeft: leftSidebarWidth },
              }}
            >
              <Tabs.Trigger value="build">Build logs</Tabs.Trigger>
            </Tabs.List>

            <ScrollArea
              ref={scrollAreaRef}
              className="bg-onyx"
              onWheel={onManualScroll}
            >
              <Tabs.Content
                value="build"
                className="bg-seashell dark:bg-onyx min-h-full"
                style={{
                  ...leftSidebarOpened && { paddingLeft: leftSidebarWidth },
                }}
              >
                <BuildLogsTab />
              </Tabs.Content>
              { children }
            </ScrollArea>
          </Tabs.Root>
        </Card>
      </Resizable>
    </BottomBarContext.Provider>
  );
};

export default BottomBar;
