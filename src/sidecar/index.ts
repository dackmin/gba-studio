import readline from 'node:readline';

import type { ShellMessage, SidecarMessage, HostContext } from '../types';
import { createHandlers } from '../main/registry';
import Storage from '../main/storage';

const userDataDir = process.env.GBAS_USER_DATA;

if (!userDataDir) {
  throw new Error('GBAS_USER_DATA is required');
}

// stdout carries the protocol, so anything else must go to stderr
const write = process.stdout.write.bind(process.stdout);
// eslint-disable-next-line no-console
console.log = console.info = console.debug = console.error;

const post = (message: SidecarMessage) => {
  write(JSON.stringify(message) + '\n');
};

let nextHostCallId = 0;
const pendingHostCalls = new Map<number, {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
}>();

const callHost = (window: string, method: string, ...args: unknown[]) =>
  new Promise<any>((resolve, reject) => {
    const id = nextHostCallId++;
    pendingHostCalls.set(id, { resolve, reject });
    post({ type: 'host-call', id, window, method, args });
  });

const createContext = (window: string): HostContext => ({
  send: (channel, payload) => post({ type: 'event', window, channel, payload }),
  dialogs: {
    openDirectory: () => callHost(window, 'dialogs.openDirectory'),
    openFile: opts => callHost(window, 'dialogs.openFile', opts),
    openProject: () => callHost(window, 'dialogs.openProject'),
    saveFile: opts => callHost(window, 'dialogs.saveFile', opts),
    confirmUnsavedChanges: () => callHost(window, 'dialogs.confirmUnsavedChanges'),
    showError: (title, message) => callHost(window, 'dialogs.showError', title, message),
  },
  shell: {
    showItemInFolder: filePath => callHost(window, 'shell.showItemInFolder', filePath),
  },
  window: {
    setProgress: value => callHost(window, 'window.setProgress', value),
    allowClose: () => callHost(window, 'window.allowClose'),
    cancelQuit: () => callHost(window, 'window.cancelQuit'),
    openProject: projectPath => callHost(window, 'window.openProject', projectPath),
  },
});

const handlers = createHandlers(new Storage(userDataDir));

const onMessage = async (message: ShellMessage) => {
  if (message.type === 'invoke') {
    const handler = handlers[message.channel];

    try {
      if (!handler) {
        throw new Error(`Unknown channel: ${message.channel}`);
      }

      const result = await handler(createContext(message.window), ...message.args);
      post({ type: 'result', id: message.id, result });
    } catch (e) {
      post({ type: 'error', id: message.id, error: (e as Error).message });
    }

    return;
  }

  const pending = pendingHostCalls.get(message.id);
  pendingHostCalls.delete(message.id);

  if (message.type === 'host-result') {
    pending?.resolve(message.result);
  } else {
    pending?.reject(new Error(message.error));
  }
};

const rl = readline.createInterface({ input: process.stdin });

rl.on('line', line => {
  let message: ShellMessage;

  try {
    message = JSON.parse(line);
  } catch {
    return;
  }

  onMessage(message);
});

// The shell owns our lifetime
rl.on('close', () => process.exit(0));

post({ type: 'ready' });
