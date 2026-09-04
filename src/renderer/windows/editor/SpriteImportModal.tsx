import { type Ref, useCallback, useImperativeHandle, useState } from 'react';
import { Dialog } from '@radix-ui/themes';

import { type ModalContextType, ModalContext } from '../../services/contexts';
import DialogClose from '../../components/DialogClose';
import SpriteImportForm from './SpriteImportForm';

export interface SpriteImportModalRef {
  open: (filePath: string) => void;
  close: () => void;
}

export interface SpriteImportModalProps {
  ref: Ref<SpriteImportModalRef>;
}

const SpriteImportModal = ({
  ref,
}: SpriteImportModalProps) => {
  const [filePath, setFilePath] = useState<string | undefined>();
  const [isOpen, setIsOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    open,
    close,
  }));

  const open = (filePath: string) => {
    setFilePath(filePath);
    setIsOpen(true);
  };

  const close = useCallback(() => {
    setFilePath(undefined);
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
            Import Sprite
          </Dialog.Title>
          <SpriteImportForm path={filePath} />
        </Dialog.Content>
      </Dialog.Root>
    </ModalContext>
  );
};

export default SpriteImportModal;
