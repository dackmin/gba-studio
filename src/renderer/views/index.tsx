import type { ComponentPropsWithoutRef } from 'react';
import { CardStackIcon, GearIcon, LayersIcon, ImageIcon } from '@radix-ui/react-icons';

import type { ViewDefinition } from '../../types';
import Canvas, {
  LeftSidebar as CanvasLeftSidebar,
  RightSidebar as CanvasRightSidebar,
  BottomBar as CanvasBottomBar,
  Provider as CanvasProvider,
} from './canvas';
import Preview, {
  LeftSidebar as PreviewLeftSidebar,
} from './preview';
import Settings from './settings';
import Sprites, {
  LeftSidebar as SpritesLeftSidebar,
  RightSidebar as SpritesRightSidebar,
  BottomBar as SpritesBottomBar,
  Provider as SpritesProvider,
} from './sprites';

export const defaultView: ViewDefinition = {
  view: () => null,
  provider: ({ children }: ComponentPropsWithoutRef<any>) => children,
  leftSidebar: () => null,
  rightSidebar: () => null,
  bottomBar: () => null,
};

const views: ViewDefinition[] = [{
  name: 'canvas',
  title: 'Editor',
  icon: LayersIcon,
  view: Canvas,
  leftSidebar: CanvasLeftSidebar,
  rightSidebar: CanvasRightSidebar,
  bottomBar: CanvasBottomBar,
  provider: CanvasProvider,
}, {
  name: 'preview',
  title: 'Preview',
  icon: CardStackIcon,
  view: Preview,
  leftSidebar: PreviewLeftSidebar,
}, {
  name: 'sprites',
  title: 'Sprites',
  icon: ImageIcon,
  view: Sprites,
  provider: SpritesProvider,
  leftSidebar: SpritesLeftSidebar,
  rightSidebar: SpritesRightSidebar,
  bottomBar: SpritesBottomBar,
}, {
  name: 'settings',
  title: 'Settings',
  icon: GearIcon,
  view: Settings,
}];

export default views;
