import {
  AllSidesIcon,
  ChatBubbleIcon,
  CodeIcon,
  EyeClosedIcon,
  EyeOpenIcon,
  GroupIcon,
  LapTimerIcon,
  LayersIcon,
  ListBulletIcon,
  MixIcon,
  MoveIcon,
  Pencil1Icon,
  PlayIcon,
  ShadowIcon,
  ShadowNoneIcon,
  SpeakerLoudIcon,
  StopIcon,
} from '@radix-ui/react-icons';

import type {
  ExecuteScriptEvent,
  GameScript,
  IfEvent,
  ListCategory,
  ListItem,
  OnButtonPressEvent,
  SceneEvent,
  ShowMenuEvent,
} from '../../types';

export interface EventDefinition extends ListItem {
  keywords?: string[];
  construct?: (params?: any) => any;
}

export const AVAILABLE_EVENTS: ListCategory<EventDefinition>[] = [{
  name: 'Input',
  items: [{
    icon: MixIcon,
    name: 'Wait For Button',
    value: 'wait-for-button',
    keywords: ['button', 'input', 'press'],
    construct: () => ({ type: 'wait-for-button', buttons: [], every: false }),
  }, {
    icon: AllSidesIcon,
    name: 'On Button Press',
    value: 'on-button-press',
    keywords: ['button', 'input', 'press'],
    construct: () => ({ type: 'on-button-press', buttons: [], events: [] }),
  }],
}, {
  name: 'Camera',
  items: [{
    icon: ShadowIcon,
    name: 'Fade In',
    value: 'fade-in',
    keywords: ['camera', 'fade', 'in'],
    construct: () => ({ type: 'fade-in', duration: 200 }),
  }, {
    icon: ShadowNoneIcon,
    name: 'Fade Out',
    value: 'fade-out',
    keywords: ['camera', 'fade', 'out'],
    construct: () => ({ type: 'fade-out', duration: 200 }),
  }, {
    icon: MoveIcon,
    name: 'Move Camera To',
    value: 'move-camera-to',
    keywords: ['camera', 'move', 'pan', 'to'],
    construct: () => ({
      type: 'move-camera-to',
      x: 0,
      y: 0,
      duration: 200,
    }),
  }],
}, {
  name: 'Scene',
  items: [{
    icon: LayersIcon,
    name: 'Go To Scene',
    value: 'go-to-scene',
    keywords: ['scene', 'change', 'go to', 'goto', 'switch'],
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
    keywords: ['dialog', 'text', 'speech', 'talk'],
    construct: () => ({
      type: 'show-dialog',
      text: '',
    }),
  }, {
    icon: ListBulletIcon,
    name: 'Show Menu',
    value: 'show-menu',
    keywords: ['menu', 'choices', 'options'],
    construct: () => ({
      type: 'show-menu',
      choices: [],
    }),
  }],
}, {
  name: 'Actors',
  items: [{
    icon: EyeClosedIcon,
    name: 'Disable Actor',
    value: 'disable-actor',
    keywords: ['actor', 'disable'],
    construct: () => ({
      type: 'disable-actor',
      actor: '',
    }),
  }, {
    icon: EyeOpenIcon,
    name: 'Enable Actor',
    value: 'enable-actor',
    keywords: ['actor', 'enable'],
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
    keywords: ['variable', 'set', 'change', 'value'],
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
    keywords: ['music', 'play', 'sound'],
    construct: () => ({
      type: 'play-music',
      music_name: '',
      loop: true,
    }),
  }, {
    icon: StopIcon,
    name: 'Stop Music',
    value: 'stop-music',
    keywords: ['music', 'stop', 'sound'],
    construct: () => ({
      type: 'stop-music',
    }),
  }, {
    icon: SpeakerLoudIcon,
    name: 'Play Sound',
    value: 'play-sound',
    keywords: ['sound', 'play', 'sfx'],
    construct: () => ({
      type: 'play-sound',
    }),
  }],
}, {
  name: 'Miscellaneous',
  items: [{
    icon: LapTimerIcon,
    name: 'Wait for X milliseconds',
    keywords: ['wait', 'timer', 'delay'],
    value: 'wait',
    construct: () => ({ type: 'wait', duration: 500 }),
  }, {
    icon: GroupIcon,
    name: 'If',
    value: 'if',
    keywords: ['if', 'condition', 'check'],
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
    keywords: ['script', 'code', 'execute'],
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

export const getEventsOfType = <T extends SceneEvent>(
  type: string,
  events: SceneEvent[],
  opts?: {
    scripts?: GameScript[];
  },
): T[] => (
  events.reduce((acc, event) => {
    if (event.type === type) {
      acc.push(event as T);
    }

    if (event.type === 'if') {
      const evt = event as IfEvent;
      acc.push(...getEventsOfType<T>(type, evt.then || []));
      acc.push(...getEventsOfType<T>(type, evt.else || []));
    }

    if (event.type === 'on-button-press') {
      const evt = event as OnButtonPressEvent;
      acc.push(...getEventsOfType<T>(type, evt.events || []));
    }

    if (event.type === 'execute-script' && opts?.scripts) {
      const evt = event as ExecuteScriptEvent;
      const script = opts.scripts
        .find(s => s.id === evt.script || s._file === evt.script);

      if (script) {
        acc.push(...getEventsOfType<T>(type, script.events || [], opts));
      }
    }

    if (event.type === 'show-menu') {
      const evt = event as ShowMenuEvent;

      for (const choice of evt.choices) {
        acc.push(...getEventsOfType<T>(type, choice.events || [], opts));
      }
    }

    return acc;
  }, [] as T[])
);
