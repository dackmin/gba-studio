import { type Ref, useCallback, useImperativeHandle, useState } from 'react';
import { Dialog } from '@radix-ui/themes';

import DialogClose from '../../components/DialogClose';
import SpriteImportForm from './SpriteImportForm';
import { ModalContext, ModalContextType } from '../../services/contexts';

export interface SpriteImportModalRef {
  open: () => void;
  close: () => void;
}

export interface SpriteImportModalProps {
  ref: Ref<SpriteImportModalRef>;
}

const SpriteImportModal = ({
  ref,
}: SpriteImportModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    open,
    close,
  }));

  const open = () => {
    setIsOpen(true);
  };

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = (open?: boolean) => {
    setIsOpen(s => open ?? !s);
  };

  const getContext = useCallback((): ModalContextType => ({
    close,
  }), [close]);

  return (
    <ModalContext value={getContext()}>
      <Dialog.Root open={isOpen} onOpenChange={toggle}>
        <Dialog.Content>
          <Dialog.Close>
            <DialogClose />
          </Dialog.Close>
          <Dialog.Title align="center" className="pb-4">
            Import sprite
          </Dialog.Title>
          <SpriteImportForm />
        </Dialog.Content>
      </Dialog.Root>
    </ModalContext>
  );
};

export default SpriteImportModal;
