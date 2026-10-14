import { type ComponentPropsWithoutRef, useEffect, useRef } from 'react';
import { hsva2rgba, parseColor } from '@junipero/core';

import { loadImage } from '../../../helpers';

const FONT_URL = 'resources://public/templates/commons/graphics/font_default.bmp';
const GLYPH_SIZE = 8;
const FIRST_CHAR = 33;
const LAST_CHAR = 126;
const TRANSPARENT_COLOR: [number, number, number] = [0, 255, 0];

export const getTextWidth = (text: string, glyphWidth: number = GLYPH_SIZE) =>
  text.length * glyphWidth;

export interface PixelTextProps
  extends Omit<ComponentPropsWithoutRef<'canvas'>, 'width' | 'height'> {
  text: string;
  color?: string;
  fontUrl?: string;
  glyphHeight?: number;
  transparencyColor?: [number, number, number];
}

const PixelText = ({
  text,
  color,
  fontUrl = FONT_URL,
  glyphHeight = GLYPH_SIZE,
  transparencyColor = TRANSPARENT_COLOR,
  ...rest
}: PixelTextProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;

    const draw = async () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { willReadFrequently: true });

      if (!canvas || !ctx) {
        return;
      }

      const font = await loadImage(fontUrl);

      if (cancelled) {
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;

      [...text].forEach((char, index) => {
        const code = char.charCodeAt(0);

        if (code < FIRST_CHAR || code > LAST_CHAR) {
          return;
        }

        ctx.drawImage(
          font,
          0, (code - FIRST_CHAR) * glyphHeight, GLYPH_SIZE, glyphHeight,
          index * GLYPH_SIZE, 0, GLYPH_SIZE, glyphHeight,
        );
      });

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const { r = 0, g = 0, b = 0 } = color ? hsva2rgba(parseColor(color)) : {};

      for (let i = 0; i < data.length; i += 4) {
        if (
          data[i] === transparencyColor[0] &&
          data[i + 1] === transparencyColor[1] &&
          data[i + 2] === transparencyColor[2]
        ) {
          data[i + 3] = 0;
        } else if (color) {
          data[i] = r * 255;
          data[i + 1] = g * 255;
          data[i + 2] = b * 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
    };

    draw();

    return () => {
      cancelled = true;
    };
  }, [text, color, fontUrl, glyphHeight, transparencyColor]);

  return (
    <canvas
      { ...rest }
      ref={canvasRef}
      width={Math.max(1, getTextWidth(text))}
      height={glyphHeight}
    />
  );
};

export default PixelText;
