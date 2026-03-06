import { type ComponentPropsWithoutRef } from 'react';
import { classNames } from '@junipero/react';

export interface DialogMenuPreviewProps
  extends ComponentPropsWithoutRef<'div'> {
  items?: string[];
  maxLength?: number;
  current?: number;
}

const DialogMenuPreview = ({
  items,
  current,
  className,
  maxLength = 25,
  ...rest
}: DialogMenuPreviewProps) => {
  return (
    <div
      { ...rest }
      className={classNames(
        'dialog font-public-pixel text-black text-[8px]',
        className,
      )}
    >
      <div className="p-[8px]">
        { items?.map((item, index) => (
          <div key={index}>
            { current === index ? '>' : '\u00A0' }
            { item.slice(0, maxLength) }
          </div>
        )) }
      </div>
    </div>
  );
};

export default DialogMenuPreview;
