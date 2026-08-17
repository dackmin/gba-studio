import { classNames } from '@junipero/react';
import { CheckCircledIcon, Cross2Icon } from '@radix-ui/react-icons';
import { ComponentPropsWithoutRef } from 'react';

export interface ChecklistItemProps extends ComponentPropsWithoutRef<'div'> {
  condition: boolean;
}

const ChecklistItem = ({
  condition,
  children,
  className,
  ...rest
}: ChecklistItemProps) => {
  return (
    <div { ...rest } className={classNames('flex items-center gap-2', className)}>
      { condition ? (
        <CheckCircledIcon color="green" />
      ) : (
        <Cross2Icon color="red" />
      ) }
      { children }
    </div>
  );
};

export default ChecklistItem;
