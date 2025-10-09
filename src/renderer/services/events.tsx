import {
  AllSidesIcon,
  ChatBubbleIcon,
  CodeIcon,
  EyeClosedIcon,
  EyeOpenIcon,
  GroupIcon,
  LapTimerIcon,
  LayersIcon,
  MixIcon,
  Pencil1Icon,
  PlayIcon,
  ShadowIcon,
  ShadowNoneIcon,
  StopIcon,
} from '@radix-ui/react-icons';

import type { ListCategory, ListItem } from '../../types';

export interface EventDefinition extends ListItem {
  construct?: (params?: any) => any;
}

export const AVAILABLE_EVENTS: ListCategory<EventDefinition>[] = [{
  name: 'Input',
  items: [{
    icon: MixIcon,
    name: 'Wait For Button',
    value: 'wait-for-button',
    construct: () => ({ type: 'wait-for-button', buttons: [], every: false }),
  }, {
    icon: AllSidesIcon,
    name: 'On Button Press',
    value: 'on-button-press',
    construct: () => ({ type: 'on-button-press', buttons: [], events: [] }),
  }],
}, {
  name: 'Camera',
  items: [{
    icon: ShadowIcon,
    name: 'Fade In',
    value: 'fade-in',
    construct: () => ({ type: 'fade-in', duration: 200 }),
  }, {
    icon: ShadowNoneIcon,
    name: 'Fade Out',
    value: 'fade-out',
    construct: () => ({ type: 'fade-out', duration: 200 }),
  }],
}, {
  name: 'Scene',
  items: [{
    icon: LayersIcon,
    name: 'Go To Scene',
    value: 'go-to-scene',
    construct: () => ({
      type: 'go-to-scene',
      target: '',
    }),
  }],
}, {
  name: 'Dialogs',
  items: [{
    icon: ChatBubbleIcon,
    name: 'Show Dialog',
    value: 'show-dialog',
    construct: () => ({
      type: 'show-dialog',
      text: '',
    }),
  }],
}, {
  name: 'Actors',
  items: [{
    icon: EyeClosedIcon,
    name: 'Disable Actor',
    value: 'disable-actor',
    construct: () => ({
      type: 'disable-actor',
      actor: '',
    }),
  }, {
    icon: EyeOpenIcon,
    name: 'Enable Actor',
    value: 'enable-actor',
    construct: () => ({
      type: 'enable-actor',
      actor: '',
    }),
  }],
}, {
  name: 'Variables',
  items: [{
    icon: Pencil1Icon,
    name: 'Set Variable',
    value: 'set-variable',
    construct: () => ({
      type: 'set-variable',
      name: '',
      value: '',
    }),
  }],
}, {
  name: 'Sound',
  items: [{
    icon: PlayIcon,
    name: 'Play Music',
    value: 'play-music',
    construct: () => ({
      type: 'play-music',
      music_name: '',
      loop: true,
    }),
  }, {
    icon: StopIcon,
    name: 'Stop Music',
    value: 'stop-music',
    construct: () => ({
      type: 'stop-music',
    }),
  }],
}, {
  name: 'Miscellaneous',
  items: [{
    icon: LapTimerIcon,
    name: 'Wait for X milliseconds',
    value: 'wait',
    construct: () => ({ type: 'wait', duration: 500 }),
  }, {
    icon: GroupIcon,
    name: 'If',
    value: 'if',
    construct: () => ({
      type: 'if',
      conditions: [],
      then: [],
      else: [],
    }),
  }, {
    icon: CodeIcon,
    name: 'Execute Script',
    value: 'execute-script',
    construct: () => ({
      type: 'execute-script',
    }),
  }],
}];

export const getEventDefinition = (type: string): EventDefinition =>
  AVAILABLE_EVENTS
    .flatMap(c => c.items)
    .find(i => i.value === type) ||
  {
    value: 'unknown',
    name: 'Unknown Event',
  } as ListItem;
