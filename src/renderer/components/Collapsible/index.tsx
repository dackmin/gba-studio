import {
  createContext,
  use,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { CaretDownIcon, CaretRightIcon } from '@radix-ui/react-icons';
import { Collapsible as RadixCollapsible } from 'radix-ui';
import { classNames } from '@junipero/react';

export interface CollapsibleContextType {
  open: boolean;
}

export const CollapsibleContext = createContext<CollapsibleContextType>({
  open: false,
});

const CollapsibleRoot = ({
  className,
  children,
  open: openProp,
  onOpenChange,
  ...rest
}: RadixCollapsible.CollapsibleProps) => {
  const [open, setOpen] = useState(openProp ?? false);

  useEffect(() => {
    setOpen(openProp ?? false);
  }, [openProp]);

  const onOpenChange_ = useCallback((o: boolean) => {
    setOpen(o);
    onOpenChange?.(o);
  }, [onOpenChange]);

  return (
    <CollapsibleContext value={{ open }}>
      <RadixCollapsible.Root
        className={classNames('bg-(--gray-2)', className)}
        onOpenChange={onOpenChange_}
        { ...rest }
      >
        { children }
      </RadixCollapsible.Root>
    </CollapsibleContext>
  );
};

const CollapsibleTrigger = ({
  className,
  children,
  ...rest
}: RadixCollapsible.CollapsibleTriggerProps) => {
  const { open } = use(CollapsibleContext);

  return (
    <RadixCollapsible.Trigger asChild { ...rest }>
      <div
        className={classNames(
          'flex flex-auto items-center gap-2 px-3 py-2 cursor-pointer',
          className
        )}
      >
        { open ? <CaretDownIcon /> : <CaretRightIcon /> }
        <div className="flex-auto">{ children }</div>
      </div>
    </RadixCollapsible.Trigger>
  );
};

const CollapsibleContent = ({
  className,
  ...rest
}: RadixCollapsible.CollapsibleContentProps) => (
  <RadixCollapsible.Content
    className={classNames('pb-2', className)}
    { ...rest }
  />
);

export { CollapsibleRoot as Root };
export { CollapsibleTrigger as Trigger };
export { CollapsibleContent as Content };

export default {
  Root: CollapsibleRoot,
  Trigger: CollapsibleTrigger,
  Content: CollapsibleContent,
};
