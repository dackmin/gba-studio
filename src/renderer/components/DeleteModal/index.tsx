import { type Ref, useCallback, useImperativeHandle, useState } from 'react';
import { Button, Dialog, Spinner, Text } from '@radix-ui/themes';

import { type ModalContextType, ModalContext } from '../../services/contexts';

export interface DeleteModalRef {
  open: () => void;
  close: () => void;
}

export interface DeleteModalProps extends Dialog.RootProps {
  ref: Ref<DeleteModalRef>;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

const DeleteModal = ({
  ref,
  children,
  loading,
  onConfirm,
}: DeleteModalProps) => {
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

  const onConfirm_ = useCallback(async () => {
    await onConfirm();
    close();
  }, [onConfirm, close]);

  const getContext = useCallback((): ModalContextType => ({
    close,
  }), [close]);

  return (
    <ModalContext value={getContext()}>
      <Dialog.Root open={isOpen} onOpenChange={toggle}>
        <Dialog.Content size="1" maxWidth="300px">
          { children }
          <div className="flex justify-center gap-2 pt-4">
            <Dialog.Close>
              <Button
                variant="soft"
                color="gray"
                className="mr-2"
                type="button"
                disabled={loading}
              >
                <Text>Cancel</Text>
              </Button>
            </Dialog.Close>
            <Button
              variant="solid"
              color="red"
              disabled={loading}
              onClick={onConfirm_}
              type="button"
            >
              { loading && <Spinner /> }
              <Text>Confirm</Text>
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Root>
    </ModalContext>
  );
};

export default DeleteModal;
