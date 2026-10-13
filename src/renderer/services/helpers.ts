import type { RefCallback, RefObject } from 'react';

import type { EventValue, GameVariables } from '../../types';

export const getHudTextPreview = (
  value: EventValue,
  variables: GameVariables[],
): string => {
  if (typeof value !== 'object' || value === null) {
    return String(value ?? '');
  }

  if (value.type === 'variable') {
    const variable = variables.flatMap(v => v.values)
      .find(v => v.id === value.name || v.name === value.name);

    return typeof variable?.defaultValue === 'object' || !variable
      ? `$${variable?.name ?? ''}`
      : String(variable.defaultValue);
  }

  return '';
};

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
