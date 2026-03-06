import { type ChangeEvent, use, useCallback, useEffect, useReducer } from 'react';
import { Avatar, Button, Card, Heading, IconButton, Tabs, Text, TextField } from '@radix-ui/themes';
import { classNames, cloneDeep, mockState, set } from '@junipero/react';
import { PlusCircledIcon, TrashIcon } from '@radix-ui/react-icons';
import { v4 as uuid } from 'uuid';

import type {
  GameProject,
} from '../../../types';
import ConstrainedView from '../../windows/editor/ConstrainedView';
import { useEditor, useSprite } from '../../services/hooks';
import TimeLineBar from './TimeLineBar';

export interface SettingsState {
  project: GameProject;
  selectedConfiguration?: string;
}

const Sprites = () => {
  const { selectedSprite } = useSprite();
  const {
    bottomBarOpened,
    toggleBottomBar,
    bottomBarHeight,
    leftSidebarOpened,
    leftSidebarWidth,
    rightSidebarOpened,
    rightSidebarWidth,
  } = useEditor();

  const spriteFile = selectedSprite?._file?.replace('.json', '');

  useEffect(() => {
    if (bottomBarOpened) {
      toggleBottomBar();
    }

    // return () => {
    //   if (!bottomBarOpened) {
    //     toggleBottomBar();
    //   }
    // };
  }, [bottomBarOpened, toggleBottomBar]);

  return (
    <ConstrainedView
      className="bg-mint-2 dark:bg-onyx-2"
    >
      <div className="container px-2 py-6 flex flex-col gap-6">
        <Heading size="3">Sprite: { spriteFile || 'None selected' }</Heading>
      </div>

      <TimeLineBar />
    </ConstrainedView>
  );
};

export default Sprites;

export { default as LeftSidebar } from './LeftSidebar';
export { default as RightSidebar } from './RightSidebar';
export { default as Provider } from './Provider';

