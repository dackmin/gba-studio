import type { RefCallback, RefObject } from 'react';

// bridge undo/redo/cut/copy/paste events fire regardless of focus, so
// callers should bail out and let native text field behavior win instead
export const isEditableElementFocused = () => {
  const active = document.activeElement as HTMLElement | null;

  return !!active && (
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.nodeName) ||
    active?.isContentEditable
  );
};

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
