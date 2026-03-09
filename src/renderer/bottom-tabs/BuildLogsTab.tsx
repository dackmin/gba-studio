import { IconButton, Kbd, Tabs, Text, Tooltip } from '@radix-ui/themes';
import { useCallback, useLayoutEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { classNames } from '@junipero/react';
import { ArrowDownIcon, TrashIcon } from '@radix-ui/react-icons';

import type { BottomBarTab } from '../components/BottomBarTabs';
import { useBottomBarTabs, useLogs } from '../services/hooks';

const BuildLogsTabTitle = () => (
  <Tabs.Trigger value="build">Build logs</Tabs.Trigger>
);

const BuildLogsTabContent = () => {
  const { buildLogs, clearBuildLogs } = useLogs();
  const { manualScroll, scrolledToBottom, scrollToBottom } = useBottomBarTabs();

  useLayoutEffect(() => {
    if (!manualScroll) {
      scrollToBottom();
    }
  }, [buildLogs, manualScroll, scrollToBottom]);

  const clearLogs = useCallback(() => {
    clearBuildLogs();
  }, [clearBuildLogs]);

  useHotkeys('ctrl+k', () => {
    scrollToBottom();
  }, [scrollToBottom], { useKey: true });

  useHotkeys('ctrl+l', () => {
    clearLogs();
  }, [clearLogs], { useKey: true });

  return (
    <Tabs.Content
      value="build"
      className="bg-seashell dark:bg-onyx min-h-full"
    >
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
            onClick={clearLogs}
            className="cursor-pointer"
          >
            <TrashIcon />
          </IconButton>
        </Tooltip>
      </div>
      <pre className="whitespace-pre-wrap font-mono break-words p-4 text-sm">
        { buildLogs.map((log, index) => (
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
  title: BuildLogsTabTitle,
  content: BuildLogsTabContent,
} satisfies BottomBarTab;
