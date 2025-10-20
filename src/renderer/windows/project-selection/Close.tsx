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
      'absolute top-4 left-4 app-no-drag bg-alabaster dark:bg-nevada',
      'hover:bg-mischka hover:dark:bg-slate group transition-all',
      'duration-200 ease-in-out',
    )}
    onClick={onClick}
  >
    <Cross2Icon
      width={12}
      height={12}
      className="[&_path]:fill-seashell dark:[&_path]:fill-onyx"
    />
  </a>
);

export default Close;
