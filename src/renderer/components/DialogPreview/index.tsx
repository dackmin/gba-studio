import { useMemo, type ComponentPropsWithoutRef } from 'react';
import { classNames } from '@junipero/react';

import type { GameSpriteFile } from '../../../types';
import Sprite from '../Sprite';

export interface DialogPreviewProps extends ComponentPropsWithoutRef<'div'> {
  text: string;
  maxLineLength?: number;
  maxLines?: number;
  portrait?: Partial<GameSpriteFile>;
  portraitPosition?: 'left' | 'right';
}

const DialogPreview = ({
  text: textProp,
  maxLineLength: maxLineLengthProp,
  maxLines = 5,
  portrait,
  portraitPosition = 'left',
  className,
  ...rest
}: DialogPreviewProps) => {
  const maxLineLength = maxLineLengthProp ?? (portrait ? 24 : 27);

  const parts = useMemo(() => (
    textProp
      .split(/\r?\n/)
      .flatMap(line => (
        line.match(new RegExp(`.{1,${maxLineLength}}`, 'g')) || ['']
      ))
      .slice(0, maxLines)
  ), [textProp, maxLineLength, maxLines]);

  return (
    <div
      { ...rest }
      className={classNames(
        'dialog font-public-pixel text-black text-[8px] w-[232px]',
        className,
      )}
    >
      <div
        className={classNames(
          'p-[8px] flex gap-[4px] min-h-[32px]',
          { 'flex-row-reverse': !!portrait && portraitPosition === 'right' },
        )}
      >
        { portrait && (
          <Sprite
            sprite={portrait}
            frame={0}
            className="w-[16px] h-[16px] flex-none"
            transparencyColor={portrait.transparentColor}
          />
        ) }
        <div className="flex-auto">
          { parts.map((part, index) => (
            <div key={index}>{part}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DialogPreview;
