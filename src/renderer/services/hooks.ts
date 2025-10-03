import { useContext, useEffect, useState } from 'react';

import { AppContext, CanvasContext } from './contexts';

const queryParams = () => {
  const params = new URLSearchParams(window.location.search);
  const q: Record<string, string> = {};
  params.forEach((value, key) => {
    q[key] = value;
  });

  return q;
};

export const useQuery = <T = Record<string, string>>(init: T = {} as T) => {
  const [query, setQuery] = useState<T>({
    ...init,
    ...queryParams(),
  });

  useEffect(() => {
    const onChange = () => {
      setQuery(prev => ({
        ...prev,
        ...queryParams(),
      }));
    };

    window.addEventListener('popstate', onChange);

    return () => {
      window.removeEventListener('popstate', onChange);
    };
  }, []);

  return query;
};

export const useApp = () => useContext(AppContext);
export const useCanvas = () => useContext(CanvasContext);

export const useBridgeListener = (
  channel: string,
  func: (...args: any[]) => void,
  deps: any[] = [],
) => {
  useEffect(() => {
    return window.electron.addEventListener(channel, func);
  }, [func, ...deps]);
};
