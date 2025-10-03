import { type CardProps, Card, Text } from '@radix-ui/themes';
import { classNames } from '@junipero/react';

import { useApp } from '../../services/hooks';

const TitleBar = ({
  className,
}: CardProps) => {
  const { project, dirty } = useApp();

  return (
    <Card
      className={classNames(
        '!rounded-[20px] before:!rounded-[20px] after:!rounded-[20px]',
        'h-[48px] app-drag',
        className,
      )}
    >
      <div className="text-center">
        <Text>{ project?.name }</Text>
        { dirty && (
          <Text size="2" className="text-slate"> (modified)</Text>
        ) }
      </div>
    </Card>
  );
};

export default TitleBar;
