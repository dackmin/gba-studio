import { type ComponentPropsWithoutRef, useCallback, useReducer } from 'react';
import { mockState } from '@junipero/react';
import { v4 as uuid } from 'uuid';

import { LogsContext, LogsContextType } from '../../services/contexts';
import { useBridgeListener } from '../../services/hooks';
import { Build, LogMessage } from '../../../types';

export interface LogsStoreProps extends ComponentPropsWithoutRef<any> {}

export interface LogsState {
  buildLogs: LogMessage[];
  emulatorLogs: LogMessage[];
}

const LogsStore = ({
  children,
}: LogsStoreProps) => {
  const [state, dispatch] = useReducer(mockState<LogsState>, {
    buildLogs: [],
    emulatorLogs: [],
  });

  const addBuildLog = useCallback((log: LogMessage) => {
    dispatch(s => ({
      ...s,
      buildLogs: s.buildLogs.find(l => l.messageId === log.messageId)
        ? s.buildLogs
        : [...s.buildLogs, log].slice(-10000),
    }));
  }, []);

  useBridgeListener('build-log', addBuildLog, [addBuildLog]);

  useBridgeListener('build-started', (build: Partial<Build>) => {
    if (!state.buildLogs.length) {
      return;
    }

    addBuildLog({
      id: build.id || state.buildLogs[0].id,
      messageId: uuid(),
      type: 'log',
      message: '----------------- New Build Started -----------------',
      time: Date.now(),
    });
  }, [state.buildLogs, addBuildLog]);

  const clearBuildLogs = useCallback(() => {
    dispatch(s => ({
      ...s,
      buildLogs: [],
    }));
  }, []);

  const addEmulatorLog = useCallback((log: LogMessage) => {
    dispatch(s => ({
      ...s,
      emulatorLogs: s.emulatorLogs.find(l => l.messageId === log.messageId)
        ? s.emulatorLogs
        : [...s.emulatorLogs, log].slice(-10000),
    }));
  }, []);

  const clearEmulatorLogs = useCallback(() => {
    dispatch(s => ({
      ...s,
      emulatorLogs: [],
    }));
  }, []);

  const getContext = useCallback((): LogsContextType => ({
    buildLogs: state.buildLogs,
    emulatorLogs: state.emulatorLogs,
    clearBuildLogs,
    addEmulatorLog,
    clearEmulatorLogs,
  }), [
    state.buildLogs, state.emulatorLogs,
    clearBuildLogs, addEmulatorLog, clearEmulatorLogs,
  ]);

  return (
    <LogsContext value={getContext()}>
      { children }
    </LogsContext>
  );
};

export default LogsStore;
