import type { ComponentPropsWithoutRef } from 'react';
import { Card, Text } from '@radix-ui/themes';
import { classNames } from '@junipero/react';

import { useApp } from '../../services/hooks';

const TitleBar = ({
  className,
  ...rest
}: ComponentPropsWithoutRef<'div'>) => {
  const { project, dirty } = useApp();

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
          'h-[48px] app-drag pointer-events-auto',
        )}
      >
        <div className="text-center">
          <Text>{ project?.name }</Text>
          { dirty && (
            <Text size="2" className="text-slate"> (modified)</Text>
          ) }
        </div>
      </Card>
    </div>
  );
};

export default TitleBar;
