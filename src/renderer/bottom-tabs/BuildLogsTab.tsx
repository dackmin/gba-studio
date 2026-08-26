import { IconButton, Kbd, Select, Tabs, Text, Tooltip } from '@radix-ui/themes';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
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
  const [logFilter, setLogFilter] = useState('all');

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

  const logs = useMemo(() => (
    buildLogs.filter(log => logFilter === 'all' || log.type === logFilter)
  ), [buildLogs, logFilter]);

  return (
    <Tabs.Content
      value="build"
      className="bg-seashell dark:bg-onyx min-h-full"
    >
      <div
        className={classNames(
          'bg-mischka dark:bg-gondola sticky p-2 top-0 flex items-center gap-2',
          'justify-between'
        )}
      >
        <div className="flex items-center gap-2">
          <Select.Root size="1" value={logFilter} onValueChange={setLogFilter}>
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="all">All</Select.Item>
              <Select.Item value="log">Log</Select.Item>
              <Select.Item value="error">Error</Select.Item>
              <Select.Item value="success">Success</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>
        <div className="flex items-center gap-2">
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
      </div>
      <pre className="whitespace-pre-wrap font-mono break-words p-4 text-sm">
        { logs.map((log, index) => (
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
  id: 'build',
  title: BuildLogsTabTitle,
  content: BuildLogsTabContent,
} satisfies BottomBarTab;
