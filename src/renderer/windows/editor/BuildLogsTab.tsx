import { useLayoutEffect, useState } from 'react';

import { useBottomBar, useBridgeListener } from '../../services/hooks';

const BuildLogsTab = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const { manualScroll, scrollToBottom } = useBottomBar();

  useBridgeListener('build-log', ({ message }: { message: string }) => {
    setLogs(prevLogs => [...prevLogs, message].slice(-100));
  }, []);

  useLayoutEffect(() => {
    if (!manualScroll) {
      scrollToBottom();
    }
  }, [logs, manualScroll, scrollToBottom]);

  return (
    <pre className="whitespace-pre-wrap font-mono break-words p-4 text-sm">
      { logs.join('\n') }
    </pre>
  );
};

export default BuildLogsTab;
