import { classNames } from '@junipero/react';
import {
  TriangleDownIcon,
  TriangleLeftIcon,
  TriangleRightIcon,
  TriangleUpIcon,
} from '@radix-ui/react-icons';
import { SegmentedControl } from '@radix-ui/themes';

export interface DirectionFieldProps extends SegmentedControl.RootProps {
  exclude?: string[];
}

const DirectionField = ({
  className,
  exclude = ['up_left', 'up_right', 'down_left', 'down_right'],
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
      { !exclude.includes('down') && (
        <SegmentedControl.Item title="Down" value="down">
          <TriangleDownIcon />
        </SegmentedControl.Item>
      ) }
      { !exclude.includes('left') && (
        <SegmentedControl.Item title="Left" value="left">
          <TriangleLeftIcon />
        </SegmentedControl.Item>
      ) }
      { !exclude.includes('up') && (
        <SegmentedControl.Item title="Up" value="up">
          <TriangleUpIcon />
        </SegmentedControl.Item>
      ) }
      { !exclude.includes('right') && (
        <SegmentedControl.Item title="Right" value="right">
          <TriangleRightIcon />
        </SegmentedControl.Item>
      ) }
      { !exclude.includes('up_left') && (
        <SegmentedControl.Item title="Up Left" value="up_left">
          <TriangleUpIcon className="rotate-[-45deg]" />
        </SegmentedControl.Item>
      ) }
      { !exclude.includes('up_right') && (
        <SegmentedControl.Item title="Up Right" value="up_right">
          <TriangleUpIcon className="rotate-[45deg]" />
        </SegmentedControl.Item>
      ) }
      { !exclude.includes('down_left') && (
        <SegmentedControl.Item title="Down Left" value="down_left">
          <TriangleDownIcon className="rotate-[45deg]" />
        </SegmentedControl.Item>
      ) }
      { !exclude.includes('down_right') && (
        <SegmentedControl.Item title="Down Right" value="down_right">
          <TriangleDownIcon className="rotate-[-45deg]" />
        </SegmentedControl.Item>
      ) }
    </SegmentedControl.Root>
  );
};

export default DirectionField;
