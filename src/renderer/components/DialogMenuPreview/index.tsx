import { type ComponentPropsWithoutRef, useMemo } from 'react';
import { classNames } from '@junipero/react';

import type { GameFontFile } from '../../../types';
import { getAssetUrl } from '../../../helpers';
import { hexToRgb } from '../../services/helpers';
import { useProjectFont } from '../../services/hooks';
import PixelText from '../PixelText';

export interface DialogMenuPreviewProps
  extends ComponentPropsWithoutRef<'div'> {
  items?: string[];
  maxLength?: number;
  current?: number;
  font?: Partial<GameFontFile>;
}

const DialogMenuPreview = ({
  items,
  current,
  font,
  className,
  maxLength = 25,
  ...rest
}: DialogMenuPreviewProps) => {
  const projectFont = useProjectFont();
  const menuFont = useMemo(() => (
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

  return (
    <div
      { ...rest }
      className={classNames(
        'dialog p-[8px] flex flex-col gap-[4px]',
        className,
      )}
    >
      { items?.map((item, index) => (
        <div key={index} className="flex items-center gap-[4px]">
          <PixelText
            text={current === index ? '>' : ' '}
            color="#000"
            { ...menuFont }
          />
          <PixelText
            text={item.slice(0, maxLength)}
            color="#000"
            { ...menuFont }
          />
        </div>
      )) }
    </div>
  );
};

export default DialogMenuPreview;
