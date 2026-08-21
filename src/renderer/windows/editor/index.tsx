import { Fragment, useCallback, useMemo, useReducer, useRef } from 'react';
import { classNames, mockState } from '@junipero/react';
import { useHotkeys } from 'react-hotkeys-hook';

import { type EditorContextType, EditorContext } from '../../services/contexts';
import { useApp, useBridgeListener } from '../../services/hooks';
import views, { defaultView } from '../../views';
import LeftSidebar from './LeftSidebar';
import TitleBar from './TitleBar';
import RightSidebar from './RightSidebar';
import BottomBar from './BottomBar';
import LogsStore from './LogsStore';
import LocalDataStore from './LocalDataStore';
import SpriteImportModal, { type SpriteImportModalRef } from './SpriteImportModal';
import BackgroundImportModal, { type BackgroundImportModalRef } from './BackgroundImportModal';
import SoundImportModal, { type SoundImportModalRef } from './SoundImportModal';
import MusicImportModal, { type MusicImportModalRef } from './MusicImportModal';

export interface EditorState {
  view: string;
  leftSidebarOpened: boolean;
  leftSidebarWidth: number;
  rightSidebarOpened: boolean;
  rightSidebarWidth: number;
  bottomBarOpened: boolean;
  bottomBarHeight: number;
  tileX?: number;
  tileY?: number;
}

const Editor = () => {
  const { project } = useApp();
  const spriteModalRef = useRef<SpriteImportModalRef>(null);
  const backgroundModalRef = useRef<BackgroundImportModalRef>(null);
  const soundModalRef = useRef<SoundImportModalRef>(null);
  const musicModalRef = useRef<MusicImportModalRef>(null);
  const [state, dispatch] = useReducer(mockState<EditorState>, {
    view: 'canvas',
    leftSidebarOpened: true,
    leftSidebarWidth: 300,
    rightSidebarOpened: true,
    rightSidebarWidth: 300,
    bottomBarOpened: true,
    bottomBarHeight: 300,
    tileX: undefined,
    tileY: undefined,
  });

  useBridgeListener('build-completed', () => {
    const emulatorType = project?.settings?.emulatorType || 'internal';

    if (emulatorType !== 'external') {
      dispatch({ view: 'preview' });
    }
  }, []);

  useBridgeListener('import-sprite', () => {
    backgroundModalRef.current?.close();
    soundModalRef.current?.close();
    musicModalRef.current?.close();
    spriteModalRef.current?.open();
  });

  useBridgeListener('import-background', () => {
    spriteModalRef.current?.close();
    soundModalRef.current?.close();
    musicModalRef.current?.close();
    backgroundModalRef.current?.open();
  });

  useBridgeListener('import-sound', () => {
    backgroundModalRef.current?.close();
    spriteModalRef.current?.close();
    musicModalRef.current?.close();
    soundModalRef.current?.open();
  });

  useBridgeListener('import-music', () => {
    backgroundModalRef.current?.close();
    spriteModalRef.current?.close();
    soundModalRef.current?.close();
    musicModalRef.current?.open();
  });

  const {
    view: View,
    provider: Provider = defaultView.provider || Fragment,
    leftSidebar: LeftSidebarContent = defaultView.leftSidebar || Fragment,
    rightSidebar: RightSidebarContent,
    bottomBar: BottomBarContent,
  } = useMemo(() => (
    views.find(v => v.name === state.view) || defaultView
  ), [state.view]);

  const toggleLeftSidebar = useCallback(() => {
    dispatch(s => ({ ...s, leftSidebarOpened: !s.leftSidebarOpened }));
  }, []);

  const toggleRightSidebar = useCallback(() => {
    dispatch(s => ({ ...s, rightSidebarOpened: !s.rightSidebarOpened }));
  }, []);

  const toggleBottomBar = useCallback(() => {
    dispatch(s => ({ ...s, bottomBarOpened: !s.bottomBarOpened }));
  }, []);

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

  const setTilePosition = useCallback((x?: number, y?: number) => {
    dispatch({ tileX: x, tileY: y });
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
    hasRightSidebar: !!RightSidebarContent,
    bottomBarOpened: state.bottomBarOpened,
    bottomBarHeight: state.bottomBarHeight,
    hasBottomBar: !!BottomBarContent,
    tileX: state.tileX,
    tileY: state.tileY,
    setView,
    toggleLeftSidebar,
    setLeftSidebarWidth,
    toggleRightSidebar,
    setRightSidebarWidth,
    toggleBottomBar,
    setBottomBarHeight,
    setTilePosition,
  }), [
    state.view, state.leftSidebarOpened, state.leftSidebarWidth,
    state.rightSidebarWidth, state.bottomBarOpened, state.bottomBarHeight,
    state.rightSidebarOpened, state.tileX, state.tileY,
    setView, toggleLeftSidebar, setLeftSidebarWidth, setRightSidebarWidth,
    toggleRightSidebar, setBottomBarHeight, toggleBottomBar, setTilePosition,
    BottomBarContent, RightSidebarContent,
  ]);

  return (
    <EditorContext value={getContext()}>
      <LocalDataStore>
        <LogsStore>
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
              { BottomBarContent && (
                <BottomBar>
                  <BottomBarContent />
                </BottomBar>
              ) }
            </div>
            <View />

            <SpriteImportModal ref={spriteModalRef} />
            <BackgroundImportModal ref={backgroundModalRef} />
            <SoundImportModal ref={soundModalRef} />
            <MusicImportModal ref={musicModalRef} />
          </Provider>
        </LogsStore>
      </LocalDataStore>
    </EditorContext>
  );
};

export default Editor;
