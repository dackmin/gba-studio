import { useCallback, useMemo, useReducer } from 'react';
import { classNames, mockState } from '@junipero/react';

import { type EditorContextType, EditorContext } from '../../services/contexts';
import views, { defaultView } from '../../views';
import LeftSidebar from './LeftSidebar';
import TitleBar from './TitleBar';
import RightSidebar from './RightSidebar';

export interface EditorState {
  view: string;
  leftSidebarOpened: boolean;
}

const Editor = () => {
  const [state, dispatch] = useReducer(mockState<EditorState>, {
    view: 'canvas',
    leftSidebarOpened: true,
  });

  const {
    view: View,
    provider: Provider = defaultView.provider,
    leftSidebar: LeftSidebarContent = defaultView.leftSidebar,
    rightSidebar: RightSidebarContent = defaultView.rightSidebar,
  } = useMemo(() => (
    views.find(v => v.name === state.view) || defaultView
  ), [state.view]);

  const toggleLeftSidebar = useCallback(() => {
    dispatch(s => ({ ...s, leftSidebarOpened: !s.leftSidebarOpened }));
  }, [state.leftSidebarOpened]);

  const setView = useCallback((view: string) => {
    dispatch({ view });
  }, []);

  const getContext = useCallback((): EditorContextType => ({
    view: state.view,
    leftSidebarOpened: state.leftSidebarOpened,
    setView,
    toggleLeftSidebar,
  }), [
    state.view, state.leftSidebarOpened,
    setView, toggleLeftSidebar,
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
          <RightSidebar>
            <RightSidebarContent />
          </RightSidebar>
        </div>
        <View />
      </Provider>
    </EditorContext.Provider>
  );
};

export default Editor;
