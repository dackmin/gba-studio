import { Fragment, useCallback, useMemo, useReducer } from 'react';
import { classNames, mockState } from '@junipero/react';
import { useHotkeys } from 'react-hotkeys-hook';

import { type EditorContextType, EditorContext } from '../../services/contexts';
// import { useBridgeListener } from '../../services/hooks';
import views, { defaultView } from '../../views';
import LeftSidebar from './LeftSidebar';
import TitleBar from './TitleBar';
import RightSidebar from './RightSidebar';
import BottomBar from './BottomBar';

export interface EditorState {
  view: string;
  leftSidebarOpened: boolean;
  leftSidebarWidth: number;
  rightSidebarOpened: boolean;
  rightSidebarWidth: number;
  bottomBarOpened: boolean;
  bottomBarHeight: number;
}

const Editor = () => {
  const [state, dispatch] = useReducer(mockState<EditorState>, {
    view: 'canvas',
    leftSidebarOpened: true,
    leftSidebarWidth: 300,
    rightSidebarOpened: true,
    rightSidebarWidth: 300,
    bottomBarOpened: true,
    bottomBarHeight: 300,
  });

  // TODO: re-enable when preview works
  // useBridgeListener('build-completed', () => {
  //   dispatch({ view: 'preview' });
  // }, []);

  const {
    view: View,
    provider: Provider = defaultView.provider || Fragment,
    leftSidebar: LeftSidebarContent = defaultView.leftSidebar || Fragment,
    rightSidebar: RightSidebarContent,
    bottomBar: BottomBarContent = defaultView.bottomBar || Fragment,
  } = useMemo(() => (
    views.find(v => v.name === state.view) || defaultView
  ), [state.view]);

  const toggleLeftSidebar = useCallback(() => {
    dispatch(s => ({ ...s, leftSidebarOpened: !s.leftSidebarOpened }));
  }, [state.leftSidebarOpened]);

  const toggleRightSidebar = useCallback(() => {
    dispatch(s => ({ ...s, rightSidebarOpened: !s.rightSidebarOpened }));
  }, [state.rightSidebarOpened]);

  const toggleBottomBar = useCallback(() => {
    dispatch(s => ({ ...s, bottomBarOpened: !s.bottomBarOpened }));
  }, [state.bottomBarOpened]);

  const setView = useCallback((view: string) => {
    dispatch({ view });
  }, []);

  const setLeftSidebarWidth = useCallback((width: number) => {
    dispatch({ leftSidebarWidth: width });
  }, []);

  const setRightSidebarWidth = useCallback((width: number) => {
    dispatch({ rightSidebarWidth: width });
  }, []);

  const setBottomBarHeight = useCallback((height: number) => {
    dispatch({ bottomBarHeight: height });
  }, []);

  useHotkeys('mod+right', () => {
    toggleRightSidebar();
  }, [toggleRightSidebar]);

  useHotkeys('mod+down', () => {
    toggleBottomBar();
  }, [toggleBottomBar]);

  useHotkeys('mod+left', () => {
    toggleLeftSidebar();
  }, [toggleLeftSidebar]);

  const getContext = useCallback((): EditorContextType => ({
    view: state.view,
    leftSidebarOpened: state.leftSidebarOpened,
    leftSidebarWidth: state.leftSidebarWidth,
    rightSidebarOpened: state.rightSidebarOpened,
    rightSidebarWidth: state.rightSidebarWidth,
    bottomBarOpened: state.bottomBarOpened,
    bottomBarHeight: state.bottomBarHeight,
    setView,
    toggleLeftSidebar,
    setLeftSidebarWidth,
    toggleRightSidebar,
    setRightSidebarWidth,
    toggleBottomBar,
    setBottomBarHeight,
  }), [
    state.view, state.leftSidebarOpened, state.leftSidebarWidth,
    state.rightSidebarWidth, state.bottomBarOpened, state.bottomBarHeight,
    state.bottomBarOpened, state.bottomBarHeight,
    setView, toggleLeftSidebar, setLeftSidebarWidth, setRightSidebarWidth,
    toggleRightSidebar, setBottomBarHeight, toggleBottomBar,
  ]);

  return (
    <EditorContext.Provider value={getContext()}>
      <Provider>
        <div
          className={classNames(
            'fixed w-screen h-screen top-0 left-0 pointer-events-none z-1000',
            'flex items-stretch',
          )}
        >
          <div
            className={classNames(
              'fixed top-0 left-0 w-screen h-[15px] app-drag',
              'pointer-events-auto'
            )}
          />

          <LeftSidebar>
            <LeftSidebarContent />
          </LeftSidebar>
          <TitleBar />
          { RightSidebarContent && (
            <RightSidebar>
              <RightSidebarContent />
            </RightSidebar>
          ) }
          <BottomBar>
            <BottomBarContent />
          </BottomBar>
        </div>
        <View />
      </Provider>
    </EditorContext.Provider>
  );
};

export default Editor;
