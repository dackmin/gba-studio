import { useCallback, useLayoutEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { IconButton, Kbd, Tabs, Text, Tooltip } from '@radix-ui/themes';
import { ArrowDownIcon, TrashIcon } from '@radix-ui/react-icons';
import { classNames } from '@junipero/react';

import { useBottomBarTabs, useLogs } from '../../services/hooks';
import { BottomBarTab } from '../../components/BottomBarTabs';

const EmulatorLogsTabTitle = () => (
  <Tabs.Trigger value="emulator-logs">Emulator logs</Tabs.Trigger>
);

const EmulatorLogsTabContent = () => {
  const { emulatorLogs, clearEmulatorLogs } = useLogs();
  const { manualScroll, scrolledToBottom, scrollToBottom } = useBottomBarTabs();

  useLayoutEffect(() => {
    if (!manualScroll) {
      scrollToBottom();
    }
  }, [emulatorLogs, manualScroll, scrollToBottom]);

  useHotkeys('ctrl+k', () => {
    scrollToBottom();
  }, [scrollToBottom], { useKey: true });

  useHotkeys('ctrl+l', () => {
    clearEmulatorLogs();
  }, [clearEmulatorLogs], { useKey: true });

  const getTime = useCallback((time?: number) => {
    if (!time) {
      return '';
    }

    const date = new Date(time);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');

    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }, []);

  return (
    <Tabs.Content value="emulator-logs">
      <div
        className={classNames(
          'bg-mischka dark:bg-gondola sticky p-2 top-0 flex items-center gap-2',
          'justify-end'
        )}
      >
        <Tooltip
          content={(
            <span className="flex items-center gap-2">
              <Text>Follow logs</Text>
              <Kbd>Ctrl + K</Kbd>
            </span>
          )}
        >
          <IconButton
            size="1"
            variant="ghost"
            disabled={scrolledToBottom}
            onClick={scrollToBottom}
            className="cursor-pointer"
          >
            <ArrowDownIcon />
          </IconButton>
        </Tooltip>
        <Tooltip
          content={(
            <span className="flex items-center gap-2">
              <Text>Clear console</Text>
              <Kbd>Ctrl + L</Kbd>
            </span>
          )}
        >
          <IconButton
            size="1"
            variant="ghost"
            onClick={clearEmulatorLogs}
            className="cursor-pointer"
          >
            <TrashIcon />
          </IconButton>
        </Tooltip>
      </div>
      <pre className="whitespace-pre-wrap font-mono break-words p-4 text-sm">
        { emulatorLogs.map((log, index) => (
          <div className="flex items-start gap-4" key={index}>
            <span className="text-gray-500">{ getTime(log.time) }</span>
            <span
              className={classNames(
                {
                  'text-red-500 font-bold': log.type === 'error',
                  'text-green-500 font-bold': log.type === 'success',
                },
              )}
            >
              { log.message }
            </span>
          </div>
        )) }
      </pre>
    </Tabs.Content>
  );
};

export default {
  id: 'emulator-logs',
  title: EmulatorLogsTabTitle,
  content: EmulatorLogsTabContent,
} satisfies BottomBarTab;
