import { type FC, Fragment, useCallback, useReducer, useRef } from 'react';
import { ScrollArea, Tabs } from '@radix-ui/themes';
import { mockState } from '@junipero/react';

import {
  type BottomBarTabsContextType,
  BottomBarTabsContext,
} from '../../services/contexts';
import { useEditor } from '../../services/hooks';

export interface BottomBarTab {
  title: FC;
  content: FC;
}

export interface BottomBarTabsProps {
  tabs: BottomBarTab[];
}

export interface BottomBarTabsState {
  tab: string;
  manualScroll: boolean;
  scrolledToBottom: boolean;
}

const BottomBarTabs = ({
  tabs,
}: BottomBarTabsProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const {
    leftSidebarOpened,
    leftSidebarWidth,
  } = useEditor();
  const [state, dispatch] = useReducer(mockState<BottomBarTabsState>, {
    tab: 'build',
    manualScroll: false,
    scrolledToBottom: true,
  });

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

  const getContext = useCallback((): BottomBarTabsContextType => ({
    manualScroll: state.manualScroll,
    scrolledToBottom: state.scrolledToBottom,
    scrollToBottom,
    isScrolledToBottom,
  }), [
    state.manualScroll, state.scrolledToBottom,
    scrollToBottom, isScrolledToBottom,
  ]);

  return (
    <BottomBarTabsContext.Provider value={getContext()}>
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
          { tabs.map(({ title: Title }, index) => (
            <Fragment key={index}><Title /></Fragment>
          )) }
        </Tabs.List>

        <ScrollArea
          ref={scrollAreaRef}
          className="bg-onyx"
          style={{
            ...leftSidebarOpened && { paddingLeft: leftSidebarWidth },
          }}
          onWheel={onManualScroll}
        >
          { tabs.map(({ content: Content }, index) => (
            <Fragment key={index}><Content /></Fragment>
          )) }
        </ScrollArea>
      </Tabs.Root>
    </BottomBarTabsContext.Provider>
  );
};

export default BottomBarTabs;
