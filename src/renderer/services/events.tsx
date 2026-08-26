import {
  AllSidesIcon,
  ChatBubbleIcon,
  CodeIcon,
  ComponentInstanceIcon,
  ComponentNoneIcon,
  EyeClosedIcon,
  EyeOpenIcon,
  GroupIcon,
  ImageIcon,
  LapTimerIcon,
  LayersIcon,
  ListBulletIcon,
  MixIcon,
  MoveIcon,
  Pencil1Icon,
  PlayIcon,
  RadiobuttonIcon,
  ShadowIcon,
  ShadowNoneIcon,
  SpeakerLoudIcon,
  StopIcon,
} from '@radix-ui/react-icons';
import { get } from '@junipero/react';

import type {
  ExecuteScriptEvent,
  GameMenuChoice,
  GameScript,
  ListCategory,
  ListItem,
  SceneEvent,
} from '../../types';

export interface EventDefinition extends ListItem {
  keywords?: string[];
  containers?: string[];
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
    icon: RadiobuttonIcon,
    name: 'On Button Press',
    value: 'on-button-press',
    containers: ['events'],
    keywords: ['button', 'input', 'press'],
    construct: () => ({ type: 'on-button-press', buttons: [], events: [] }),
  }, {
    icon: ComponentNoneIcon,
    name: 'Disable input',
    value: 'disable-input',
    keywords: ['input', 'disable'],
    construct: () => ({ type: 'disable-input' }),
  }, {
    icon: ComponentInstanceIcon,
    name: 'Enable input',
    value: 'enable-input',
    keywords: ['input', 'enable'],
    construct: () => ({ type: 'enable-input' }),
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
  }, {
    icon: ImageIcon,
    name: 'Set Background',
    value: 'set-background',
    keywords: ['background', 'scene', 'image', 'set'],
    construct: () => ({
      type: 'set-background',
      background: '',
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
    containers: ['choices'],
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
  }, {
    icon: MoveIcon,
    name: 'Move Actor To',
    value: 'move-actor-to',
    keywords: ['actor', 'move', 'to'],
    construct: () => ({
      type: 'move-actor-to',
      actor: '',
      x: 0,
      y: 0,
    }),
  }, {
    icon: AllSidesIcon,
    name: 'Set Actor Direction',
    value: 'set-actor-direction',
    keywords: ['actor', 'direction', 'facing'],
    construct: () => ({
      type: 'set-actor-direction',
      actor: '',
      direction: 'down',
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
    containers: ['then', 'else'],
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

    if (event.type === 'execute-script' && opts?.scripts) {
      const evt = event as ExecuteScriptEvent;
      const script = opts.scripts
        .find(s => s.id === evt.script || s._file === evt.script);

      if (script) {
        acc.push(...getEventsOfType<T>(type, script.events || [], opts));

        return acc;
      }
    }

    const definition = getEventDefinition(event.type);

    if (definition.containers) {
      for (const container of definition.containers) {
        const containerEvents = get(event, container, []);

        if (Array.isArray(containerEvents)) {
          acc.push(...getEventsOfType<T>(type, containerEvents, opts));
        } else if ((containerEvents as GameMenuChoice)?.events) {
          acc.push(...getEventsOfType<T>(type, (containerEvents as GameMenuChoice).events, opts));
        }
      }
    }

    return acc;
  }, [] as T[])
);

export const getEventById = (id: string, events: SceneEvent[]): SceneEvent | undefined => {
  for (const event of events) {
    if (event.id === id) {
      return event;
    }

    const definition = getEventDefinition(event.type);

    if (definition.containers) {
      for (const container of definition.containers) {
        const containerEvents = get(event, container, []);

        if (Array.isArray(containerEvents)) {
          const found = getEventById(id, containerEvents);

          if (found) {
            return found;
          }
        } else if ((containerEvents as GameMenuChoice)?.events) {
          const found = getEventById(id, (containerEvents as GameMenuChoice).events);

          if (found) {
            return found;
          }
        }
      }
    }
  }
};

export const getEventParent = (id: string, events: SceneEvent[]): SceneEvent | undefined => {
  for (const event of events) {
    const definition = getEventDefinition(event.type);

    if (definition.containers) {
      for (const container of definition.containers) {
        const containerEvents = get<SceneEvent, SceneEvent[]>(event, container, []);

        if (Array.isArray(containerEvents)) {
          if (containerEvents.some(e => e.id === id)) {
            return event;
          }

          const found = getEventParent(id, containerEvents);

          if (found) {
            return found;
          }
        } else if ((containerEvents as GameMenuChoice)?.events) {
          if ((containerEvents as GameMenuChoice).events.some(e => e.id === id)) {
            return event;
          }

          const found = getEventParent(id, (containerEvents as GameMenuChoice).events);

          if (found) {
            return found;
          }
        }
      }
    }
  }
};

export const isChildOfEvent = (
  childId: string,
  parentId: string,
  events: SceneEvent[]
): boolean => {
  const parent = getEventById(parentId, events);

  if (!parent) {
    return false;
  }

  const definition = getEventDefinition(parent.type);

  if (definition.containers) {
    for (const container of definition.containers) {
      const containerEvents = get<SceneEvent, SceneEvent[]>(parent, container, []);

      if (Array.isArray(containerEvents)) {
        if (containerEvents.some(e => e.id === childId)) {
          return true;
        }

        if (containerEvents.some(e => isChildOfEvent(childId, e.id, events))) {
          return true;
        }
      } else if ((containerEvents as GameMenuChoice)?.events) {
        if ((containerEvents as GameMenuChoice).events.some(e => e.id === childId)) {
          return true;
        }

        if ((containerEvents as GameMenuChoice).events
          .some(e => isChildOfEvent(childId, e.id, events))) {
          return true;
        }
      }
    }
  }

  return false;
};
