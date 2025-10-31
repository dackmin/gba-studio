import { useCallback, useLayoutEffect, useState } from 'react';
import { IconButton, Tooltip } from '@radix-ui/themes';
import { classNames } from '@junipero/react';
import { TrashIcon } from '@radix-ui/react-icons';

import type { BuildMessage } from '../../../types';
import { useBottomBar, useBridgeListener } from '../../services/hooks';

const BuildLogsTab = () => {
  const [logs, setLogs] = useState<BuildMessage[]>([]);
  const { manualScroll, scrollToBottom } = useBottomBar();

  useBridgeListener('build-log', (message: BuildMessage) => {
    setLogs(prevLogs => [...prevLogs, message].slice(-10000));
  }, []);

  useLayoutEffect(() => {
    if (!manualScroll) {
      scrollToBottom();
    }
  }, [logs, manualScroll, scrollToBottom]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <div>
      <div
        className={classNames(
          'bg-mischka dark:bg-gondola sticky p-2 top-0 flex items-center gap-2',
          'justify-end'
        )}
      >
        <Tooltip content="Clear console">
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
        { logs.map((log, index) => (
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
    </div>
  );
};

export default BuildLogsTab;
