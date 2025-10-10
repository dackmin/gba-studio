import { classNames } from '@junipero/react';
import {
  TriangleDownIcon,
  TriangleLeftIcon,
  TriangleRightIcon,
  TriangleUpIcon,
} from '@radix-ui/react-icons';
import { SegmentedControl } from '@radix-ui/themes';

export interface DirectionFieldProps extends SegmentedControl.RootProps {}

const DirectionField = ({
  className,
  ...rest
}: DirectionFieldProps) => {
  return (
    <SegmentedControl.Root
      { ...rest }
      className={classNames(
        '[&_span]:!px-0',
        className,
      )}
    >
      <SegmentedControl.Item title="Down" value="down">
        <TriangleDownIcon />
      </SegmentedControl.Item>
      <SegmentedControl.Item title="Left" value="left">
        <TriangleLeftIcon />
      </SegmentedControl.Item>
      <SegmentedControl.Item title="Up" value="up">
        <TriangleUpIcon />
      </SegmentedControl.Item>
      <SegmentedControl.Item title="Right" value="right">
        <TriangleRightIcon />
      </SegmentedControl.Item>
    </SegmentedControl.Root>
  );
};

export default DirectionField;
