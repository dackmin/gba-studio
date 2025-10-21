import { type ComponentPropsWithoutRef, useState } from 'react';
import { Card, Spinner, Text } from '@radix-ui/themes';
import { classNames } from '@junipero/react';

import type { BuildMessage } from '../../../types';
import { useApp, useBridgeListener, useEditor } from '../../services/hooks';

const TitleBar = ({
  className,
  ...rest
}: ComponentPropsWithoutRef<'div'>) => {
  const { project, dirty, building } = useApp();
  const { leftSidebarOpened } = useEditor();
  const [step, setStep] = useState('Initializing build...');

  useBridgeListener('build-step', ({ message }: BuildMessage) => {
    setStep(message);
  }, []);

  return (
    <div
      { ...rest }
      className={classNames(
        'flex-auto p-2',
        className,
      )}
    >
      <Card
        className={classNames(
          '!rounded-[20px] before:!rounded-[20px] after:!rounded-[20px]',
          'h-[48px] pointer-events-auto',
        )}
      >
        <div className="flex items-center justify-between">
          { building && (
            <div
              className={classNames(
                'flex items-center gap-2',
                {
                  'pl-48': !leftSidebarOpened,
                }
              )}
            >
              <Spinner size="1" />
              <Text size="1">{ step }</Text>
            </div>
          ) }
          <div className="flex-auto text-center">
            <Text>{ project?.name }</Text>
            { dirty && (
              <Text size="2" className="text-slate"> (modified)</Text>
            ) }
          </div>
          { building && <div /> }
        </div>
      </Card>
    </div>
  );
};

export default TitleBar;
