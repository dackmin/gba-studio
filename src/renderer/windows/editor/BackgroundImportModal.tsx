import { type Ref, useCallback, useImperativeHandle, useState } from 'react';
import { Dialog } from '@radix-ui/themes';

import { ModalContext, type ModalContextType } from '../../services/contexts';
import DialogClose from '../../components/DialogClose';
import BackgroundImportForm from './BackgroundImportForm';

export interface BackgroundImportModalRef {
  open: () => void;
  close: () => void;
}

export interface BackgroundImportModalProps {
  ref: Ref<BackgroundImportModalRef>;
}

const BackgroundImportModal = ({
  ref,
}: BackgroundImportModalProps) => {
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
            Import background
          </Dialog.Title>
          <BackgroundImportForm />
        </Dialog.Content>
      </Dialog.Root>
    </ModalContext>
  );
};

export default BackgroundImportModal;
