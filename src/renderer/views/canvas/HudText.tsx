import { type MouseEvent, useCallback, useMemo } from 'react';
import {
  type MoveableProps,
  Moveable,
  classNames,
  useInfiniteCanvas,
} from '@junipero/react';
import { ContextMenu } from '@radix-ui/themes';

import type { GameHudText } from '../../../types';
import { useApp, useCanvas, usePreviewCursor, useProjectFont } from '../../services/hooks';
import { findFont, getAssetUrl } from '../../../helpers';
import { getHudTextPreview, hexToRgb } from '../../services/helpers';
import PixelText, { getTextWidth } from '../../components/PixelText';

export interface HudTextProps extends MoveableProps {
  item: GameHudText;
  preview?: boolean;
  onSelect?: (e: MouseEvent<HTMLElement>) => void;
  onDelete?: () => void;
}

const HudText = ({
  item,
  preview = false,
  onSelect,
  onMoveEnd,
  onDelete,
  ...rest
}: HudTextProps) => {
  const { zoom } = useInfiniteCanvas();
  const cursor = usePreviewCursor(preview);
  const { tool, selectedItem } = useCanvas();
  const { variables, fonts } = useApp();
  const projectFont = useProjectFont();
  const text = useMemo(() => (
    getHudTextPreview(item.text, variables).slice(0, 30)
  ), [item.text, variables]);
  const customFont = useMemo(() => (
    item.font ? findFont(fonts, item.font) : undefined
  ), [item.font, fonts]);
  const fontProps = useMemo(() => (
    customFont ? {
      fontUrl: getAssetUrl(customFont),
      glyphHeight: customFont.height || 8,
      transparencyColor: customFont.transparentColor
        ? hexToRgb(customFont.transparentColor)
        : undefined,
    } : projectFont
  ), [customFont, projectFont]);

  const onSelect_ = useCallback((e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    onSelect?.(e);
  }, [onSelect]);

  return (
    <Moveable
      { ...rest }
      transformScale={zoom}
      disabled={
        (tool === 'add' && !preview) || tool !== 'default' ||
        selectedItem !== item
      }
      x={preview ? cursor?.x : item.x || 0}
      y={preview ? cursor?.y : item.y || 0}
      onMouseDown={onSelect_}
      onMoveEnd={onMoveEnd}
      style={{
        left: 0,
        top: 0,
        width: Math.max(8, getTextWidth(text)),
        height: fontProps.glyphHeight,
      }}
    >
      <div className="absolute w-full h-full">
        <ContextMenu.Root>
          <ContextMenu.Trigger className="cursor-default!">
            <div className="relative w-full h-full">
              <div
                className={classNames(
                  'absolute hover:border-1 border-(--accent-9)',
                  'z-2 w-full h-full top-0 left-0',
                  { 'border-1': selectedItem === item },
                )}
              />
              <PixelText
                className="absolute z-1 top-0 left-0 pixelated"
                text={text}
                color={item.color}
                { ...fontProps }
              />
            </div>
          </ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Label className="text-xs!">HUD Text</ContextMenu.Label>
            <ContextMenu.Item
              onClick={onDelete}
              shortcut={window.electron.isDarwin ? '⌦' : 'Del'}
            >
              Delete
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Root>
      </div>
    </Moveable>
  );
};

export default HudText;
