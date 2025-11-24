import type { ComponentPropsWithoutRef } from 'react';
import { CardStackIcon, GearIcon, LayersIcon } from '@radix-ui/react-icons';

import type { ViewDefinition } from '../../types';
import Canvas, {
  LeftSidebar as CanvasLeftSidebar,
  RightSidebar as CanvasRightSidebar,
  Provider as CanvasProvider,
} from './canvas';
import Preview, {
  LeftSidebar as PreviewLeftSidebar,
} from './preview';
import Settings from './settings';

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
  provider: CanvasProvider,
}, {
  name: 'preview',
  title: 'Preview',
  icon: CardStackIcon,
  view: Preview,
  leftSidebar: PreviewLeftSidebar,
}, {
  name: 'settings',
  title: 'Settings',
  icon: GearIcon,
  view: Settings,
}];

export default views;
