import { classNames } from '@junipero/react';
import { Cross2Icon } from '@radix-ui/react-icons';

export interface CloseProps {
  onClick?: () => void;
}

const Close = ({
  onClick,
}: CloseProps) => (
  <a
    className={classNames(
      'rounded-full block w-4 h-4 flex items-center justify-center',
      'absolute top-4 left-4 app-no-drag bg-mischka dark:bg-nevada',
      'hover:bg-(--accent-9) hover:dark:bg-slate group transition-all',
      'duration-200 ease-in-out',
    )}
    onClick={onClick}
  >
    <Cross2Icon
      width={12}
      height={12}
      className={classNames(
        '[&_path]:fill-slate dark:[&_path]:fill-onyx',
        'group-hover:[&_path]:fill-seashell',
        'transition-all duration-200 ease-in-out',
      )}
    />
  </a>
);

export default Close;
