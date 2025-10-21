import type { ReactNode } from 'react';
import { CardStackIcon, LayersIcon } from '@radix-ui/react-icons';

import type { ViewDefinition } from '../../types';
import Canvas, {
  LeftSidebar as CanvasLeftSidebar,
  RightSidebar as CanvasRightSidebar,
  Provider as CanvasProvider,
} from './canvas';
import Preview from './preview';

export const defaultView = {
  view: () => null,
  provider: ({ children }: { children: ReactNode }) => children,
  leftSidebar: () => null,
  rightSidebar: () => null,
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
}];

export default views;
