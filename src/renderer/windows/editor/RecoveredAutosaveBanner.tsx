import { type ComponentPropsWithoutRef, useCallback, useState } from 'react';
import { Button, Callout, Text } from '@radix-ui/themes';
import { Cross1Icon, DownloadIcon } from '@radix-ui/react-icons';
import { classNames } from '@junipero/react';

export interface RecoveredAutosaveBannerProps extends ComponentPropsWithoutRef<'div'> {
  onDiscard?: () => Promise<void>;
}

const RecoveredAutosaveBanner = ({
  className,
  onDiscard,
  ...props
}: RecoveredAutosaveBannerProps) => {
  const [closed, setClosed] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  const onDismiss = useCallback(() => {
    setClosed(true);
  }, []);

  const onDiscardClick = useCallback(async () => {
    setDiscarding(true);
    await onDiscard?.();
    setClosed(true);
  }, [onDiscard]);

  if (closed) {
    return null;
  }

  return (
    <div
      { ...props }
      className={classNames(
        'flex-none pointer-events-auto p-2 max-w-[480px] w-full',
        'fixed bottom-4 left-4 z-1000',
        className,
      )}
    >
      <Callout.Root
        highContrast={true}
        className={classNames(
          '!rounded-[20px] bg-(--accent-9)! !py-3',
        )}
      >
        <Callout.Icon>
          <DownloadIcon />
        </Callout.Icon>
        <Callout.Text className="flex flex-col items-start gap-2">
          <Text size="1" weight="medium">
            Recovered unsaved changes
          </Text>
          <Text size="1">
            The app crashed or was closed unexpectedly. Your unsaved changes
            were restored, save the project to keep them.
          </Text>
          <div className="flex items-center gap-4 mt-1">
            <Button
              size="1"
              color="gray"
              highContrast={true}
              onClick={onDiscardClick}
              disabled={discarding}
            >
              Discard changes
            </Button>
            <Button
              size="1"
              variant="ghost"
              color="gray"
              onClick={onDismiss}
            >
              <Cross1Icon /> Close
            </Button>
          </div>
        </Callout.Text>
      </Callout.Root>
    </div>
  );
};

export default RecoveredAutosaveBanner;
