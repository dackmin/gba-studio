import { useLayoutEffect } from 'react';
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
          <div
            key={index}
            className={classNames(
              {
                'text-red-500 font-bold': log.type === 'error',
                'text-green-500 font-bold': log.type === 'success',
              },
            )}
          >
            { log.message }
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
