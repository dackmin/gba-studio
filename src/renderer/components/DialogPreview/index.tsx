import { useMemo, type ComponentPropsWithoutRef } from 'react';
import { classNames } from '@junipero/react';

export interface DialogPreviewProps extends ComponentPropsWithoutRef<'div'> {
  text: string;
  maxLineLength?: number;
  maxLines?: number;
}

const DialogPreview = ({
  text: textProp,
  maxLineLength = 27,
  maxLines = 5,
  className,
  ...rest
}: DialogPreviewProps) => {
  const text = useMemo(() => (
    textProp
      .split(/\r?\n/)
      .flatMap(line => (
        line.match(new RegExp(`.{1,${maxLineLength}}`, 'g')) || ['']
      ))
      .slice(0, maxLines)
      .join('\n')
  ), [textProp, maxLineLength, maxLines]);

  return (
    <div
      { ...rest }
      className={classNames(
        'dialog font-public-pixel text-black text-[8px] w-[232px]',
        className,
      )}
    >
      <div className="p-[8px]">{ text }</div>
    </div>
  );
};

export default DialogPreview;
