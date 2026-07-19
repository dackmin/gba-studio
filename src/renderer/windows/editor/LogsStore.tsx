import { type ComponentPropsWithoutRef, useCallback, useReducer } from 'react';
import { mockState } from '@junipero/react';

import { LogsContext, LogsContextType } from '../../services/contexts';
import { useBridgeListener } from '../../services/hooks';
import { BuildMessage } from '../../../types';

export interface LogsStoreProps extends ComponentPropsWithoutRef<any> {}

export interface LogsState {
  buildLogs: BuildMessage[];
  emulatorLogs: string[];
}

const LogsStore = ({
  children,
}: LogsStoreProps) => {
  const [state, dispatch] = useReducer(mockState<LogsState>, {
    buildLogs: [],
    emulatorLogs: [],
  });

  useBridgeListener('build-log', (log: BuildMessage) => {
    dispatch(s => ({
      ...s,
      buildLogs: s.buildLogs.find(l => l.messageId === log.messageId)
        ? s.buildLogs
        : [...s.buildLogs, log].slice(-10000),
    }));
  }, []);

  const clearBuildLogs = useCallback(() => {
    dispatch(s => ({
      ...s,
      buildLogs: [],
    }));
  }, []);

  const getContext = useCallback((): LogsContextType => ({
    buildLogs: state.buildLogs,
    emulatorLogs: state.emulatorLogs,
    clearBuildLogs,
  }), [state.buildLogs, state.emulatorLogs, clearBuildLogs]);

  return (
    <LogsContext value={getContext()}>
      { children }
    </LogsContext>
  );
};

export default LogsStore;
