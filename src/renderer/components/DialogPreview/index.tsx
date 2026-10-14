import { type ComponentPropsWithoutRef, useMemo } from 'react';
import { classNames } from '@junipero/react';

import type { GameFontFile, GameSpriteFile } from '../../../types';
import { getAssetUrl } from '../../../helpers';
import { hexToRgb } from '../../services/helpers';
import { useProjectFont } from '../../services/hooks';
import Sprite from '../Sprite';
import PixelText from '../PixelText';

export interface DialogPreviewProps extends ComponentPropsWithoutRef<'div'> {
  text: string;
  maxLineLength?: number;
  maxLines?: number;
  portrait?: Partial<GameSpriteFile>;
  portraitPosition?: 'left' | 'right';
  font?: Partial<GameFontFile>;
}

const DialogPreview = ({
  text: textProp,
  maxLineLength: maxLineLengthProp,
  maxLines = 5,
  portrait,
  portraitPosition = 'left',
  font,
  className,
  ...rest
}: DialogPreviewProps) => {
  const projectFont = useProjectFont();
  const dialogFont = useMemo(() => (
    font?._file || font?.path ? {
      fontUrl: font.path?.startsWith('data:')
        ? font.path
        : getAssetUrl(font as GameFontFile),
      glyphHeight: font.height || 8,
      transparencyColor: font.transparentColor
        ? hexToRgb(font.transparentColor)
        : undefined,
    } : projectFont
  ), [font, projectFont]);
  const maxLineLength = useMemo(() => (
    maxLineLengthProp ?? (portrait ? 24 : 27)
  ), [maxLineLengthProp, portrait]);

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
        'dialog w-[232px]',
        className,
      )}
    >
      <div
        className={classNames(
          'p-[8px] flex gap-[4px]',
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
            <div key={index}>
              <PixelText text={part} color="#000" { ...dialogFont } />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DialogPreview;
