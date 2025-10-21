import { useCallback, useMemo, useReducer } from 'react';
import { classNames, mockState } from '@junipero/react';

import { type EditorContextType, EditorContext } from '../../services/contexts';
import { useBridgeListener } from '../../services/hooks';
import views, { defaultView } from '../../views';
import LeftSidebar from './LeftSidebar';
import TitleBar from './TitleBar';
import RightSidebar from './RightSidebar';

export interface EditorState {
  view: string;
  leftSidebarOpened: boolean;
  leftSidebarWidth: number;
  rightSidebarWidth: number;
}

const Editor = () => {
  const [state, dispatch] = useReducer(mockState<EditorState>, {
    view: 'canvas',
    leftSidebarOpened: true,
    leftSidebarWidth: 300,
    rightSidebarWidth: 300,
  });

  useBridgeListener('build-completed', () => {
    dispatch({ view: 'preview' });
  }, []);

  const {
    view: View,
    provider: Provider = defaultView.provider,
    leftSidebar: LeftSidebarContent = defaultView.leftSidebar,
    rightSidebar: RightSidebarContent,
  } = useMemo(() => (
    views.find(v => v.name === state.view) || defaultView
  ), [state.view]);

  const toggleLeftSidebar = useCallback(() => {
    dispatch(s => ({ ...s, leftSidebarOpened: !s.leftSidebarOpened }));
  }, [state.leftSidebarOpened]);

  const setView = useCallback((view: string) => {
    dispatch({ view });
  }, []);

  const setLeftSidebarWidth = useCallback((width: number) => {
    dispatch({ leftSidebarWidth: width });
  }, []);

  const setRightSidebarWidth = useCallback((width: number) => {
    dispatch({ rightSidebarWidth: width });
  }, []);

  const getContext = useCallback((): EditorContextType => ({
    view: state.view,
    leftSidebarOpened: state.leftSidebarOpened,
    leftSidebarWidth: state.leftSidebarWidth,
    rightSidebarWidth: state.rightSidebarWidth,
    setView,
    toggleLeftSidebar,
    setLeftSidebarWidth,
    setRightSidebarWidth,
  }), [
    state.view, state.leftSidebarOpened, state.leftSidebarWidth,
    state.rightSidebarWidth,
    setView, toggleLeftSidebar, setLeftSidebarWidth, setRightSidebarWidth,
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
        </div>
        <View />
      </Provider>
    </EditorContext.Provider>
  );
};

export default Editor;
