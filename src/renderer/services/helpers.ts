import type { RefCallback, RefObject } from 'react';

export const mergeRefs = (
  ...refs: Array<
    RefCallback<HTMLElement | null> |
    RefObject<HTMLElement | null> |
    null |
    undefined
  >
) => {
  return (instance: HTMLElement | null) => {
    refs.forEach(ref => {
      if (typeof ref === 'function') {
        ref(instance!);
      } else if (ref && 'current' in ref) {
        ref.current = instance!;
      }
    });
  };
};
