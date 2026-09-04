import { Fragment, useCallback, useMemo, useReducer, useRef } from 'react';
import { classNames, mockState, useTimeout } from '@junipero/react';

import type { LogMessage } from '../../../types';
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
  tileX?: number;
  tileY?: number;
  resizingSidebar: boolean;
  building: boolean;
  built: boolean;
  buildStep: string;
}

const Editor = () => {
  const { project, localData, projectPath } = useApp();
  const spriteModalRef = useRef<SpriteImportModalRef>(null);
  const backgroundModalRef = useRef<BackgroundImportModalRef>(null);
  const soundModalRef = useRef<SoundImportModalRef>(null);
  const musicModalRef = useRef<MusicImportModalRef>(null);
  const [state, dispatch] = useReducer(mockState<EditorState>, {
    view: localData?.editor?.view ?? 'canvas',
    tileX: undefined,
    tileY: undefined,
    resizingSidebar: false,
    building: false,
    built: false,
    buildStep: '',
  });

  useTimeout(() => {
    dispatch({ built: false, buildStep: '' });
  }, 2000, [state.built], { enabled: state.built });

  useBridgeListener('build-started', () => {
    dispatch({ building: true, built: false, buildStep: 'Initializing build...' });
  }, []);

  useBridgeListener('clean-started', () => {
    dispatch({ building: true, built: false, buildStep: 'Cleaning project...' });
  }, []);

  useBridgeListener('build-step', ({ message }: LogMessage) => {
    dispatch({ buildStep: message });
  }, []);

  useBridgeListener('build-completed', () => {
    dispatch({ building: false, built: true, buildStep: 'Build successful' });
  }, []);

  useBridgeListener('clean-completed', () => {
    dispatch({ building: false, built: true, buildStep: 'Build folder cleaned.' });
  }, []);

  useBridgeListener('build-aborted', () => {
    dispatch({ building: false, built: false, buildStep: '' });
  }, []);

  useBridgeListener('build-completed', () => {
    const emulatorType = project?.settings?.emulatorType || 'internal';

    if (emulatorType !== 'external') {
      dispatch({ view: 'preview' });
    }
  }, [project?.settings?.emulatorType]);

  useBridgeListener('import-sprite', async () => {
    backgroundModalRef.current?.close();
    soundModalRef.current?.close();
    musicModalRef.current?.close();

    const file = await window.electron.browseFile({
      projectPath,
      filters: [
        { name: 'Images', extensions: ['bmp', 'png', 'jpg'] },
      ],
    });

    if (file) {
      spriteModalRef.current?.open(file);
    }
  }, []);

  useBridgeListener('import-background', async () => {
    spriteModalRef.current?.close();
    soundModalRef.current?.close();
    musicModalRef.current?.close();

    const file = await window.electron.browseFile({
      projectPath,
      filters: [
        { name: 'Images', extensions: ['bmp', 'png', 'jpg'] },
      ],
    });

    if (file) {
      backgroundModalRef.current?.open(file);
    }
  }, []);

  useBridgeListener('import-sound', async () => {
    backgroundModalRef.current?.close();
    spriteModalRef.current?.close();
    musicModalRef.current?.close();

    const file = await window.electron.browseFile({
      projectPath,
      filters: [
        { name: 'Sounds', extensions: ['wav'] },
      ],
    });

    if (file) {
      soundModalRef.current?.open(file);
    }
  }, []);

  useBridgeListener('import-music', async () => {
    backgroundModalRef.current?.close();
    spriteModalRef.current?.close();
    soundModalRef.current?.close();

    const file = await window.electron.browseFile({
      projectPath,
      filters: [
        { name: 'Music', extensions: ['mod'] },
      ],
    });

    if (file) {
      musicModalRef.current?.open(file);
    }
  }, []);

  const {
    view: View,
    provider: Provider = defaultView.provider || Fragment,
    leftSidebar: LeftSidebarContent = defaultView.leftSidebar || Fragment,
    rightSidebar: RightSidebarContent,
    bottomBar: BottomBarContent,
  } = useMemo(() => (
    views.find(v => v.name === state.view) || defaultView
  ), [state.view]);

  const setView = useCallback((view: string) => {
    dispatch({ view });
  }, []);

  const setTilePosition = useCallback((x?: number, y?: number) => {
    dispatch({ tileX: x, tileY: y });
  }, []);

  const setResizingSidebar = useCallback((resizingSidebar: boolean) => {
    dispatch({ resizingSidebar });
  }, []);

  const getContext = useCallback((): EditorContextType => ({
    view: state.view,
    hasRightSidebar: !!RightSidebarContent,
    hasBottomBar: !!BottomBarContent,
    hasLeftSidebar: !!LeftSidebarContent,
    tileX: state.tileX,
    tileY: state.tileY,
    resizingSidebar: state.resizingSidebar,
    building: state.building,
    built: state.built,
    buildStep: state.buildStep,
    setView,
    setTilePosition,
    setResizingSidebar,
  }), [
    state.view, state.tileX, state.tileY, state.resizingSidebar,
    state.building, state.built, state.buildStep,
    setView, setTilePosition, setResizingSidebar,
    BottomBarContent, RightSidebarContent, LeftSidebarContent,
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
