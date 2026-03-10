import {
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useRef,
  useState,
} from 'react';
import { classNames, set } from '@junipero/react';
import { DropdownMenu, IconButton, Select, Text } from '@radix-ui/themes';
import {
  CaretDownIcon,
  CaretRightIcon,
  ComponentInstanceIcon,
  DotsVerticalIcon,
  MoveIcon,
} from '@radix-ui/react-icons';

import { SpriteAnimation } from '../../../types';

export interface AnimationsListItemProps {
  animation: SpriteAnimation;
  onValueChange?: (animation: SpriteAnimation) => void;
  onDelete?: (animation: SpriteAnimation) => void;
}

const AnimationsListItem = ({
  animation,
  onValueChange,
  onDelete,
}: AnimationsListItemProps) => {
  const nameRef = useRef<HTMLDivElement>(null);
  const [opened, setOpened] = useState(animation._collapsed ?? true);
  const [renaming, setRenaming] = useState(false);

  const onRename = useCallback(() => {
    if (!renaming) {
      return;
    }

    const newName = nameRef.current?.innerText.trim();

    if (newName && newName !== animation.name) {
      animation.name = newName;
      onValueChange?.(animation);
    }

    setRenaming(false);
  }, [renaming, animation, onValueChange]);

  const onNameKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const onNameClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (e.detail !== 2) {
      return;
    }

    setRenaming(true);
  }, []);

  const onRenameClick = () => {
    setTimeout(() => {
      setRenaming(true);
    }, 200);
  };

  const onDeleteClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    onDelete?.(animation);
  }, [onDelete, animation]);

  const onToggleCollapsibleClick = useCallback((
    e: MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setOpened(o => !o);
    animation._collapsed = !opened;
    onValueChange?.(animation);
  }, [opened, animation, onValueChange]);

  const onValueChange_ = useCallback((name: string, value: any) => {
    set(animation, name, value);
    onValueChange?.(animation);
  }, [animation, onValueChange]);

  return (
    <div
      className={classNames(
        'bg-(--gray-2) flex flex-col',
      )}
    >
      <div
        className={classNames(
          'px-3 py-2 w-full flex items-center flex-nowrap',
        )}
      >
        <div
          className={classNames(
            'flex items-center flex-nowrap justify-start flex-auto gap-2',
          )}
        >
          <div className="flex-none">
            { animation.animationType === 'fixed' ? (
              <ComponentInstanceIcon className="[&_path]:fill-(--accent-9)" />
            ) : (
              <MoveIcon className="[&_path]:fill-(--accent-9)" />
            ) }
          </div>
          <div
            ref={nameRef}
            className={classNames(
              'whitespace-nowrap',
              {
                [
                'overflow-scroll focus:outline-2 flex-auto' +
                  'outline-(--accent-9) rounded-xs'
                ]: renaming,
                'overflow-hidden text-ellipsis flex-none': !renaming,
              }
            )}
            contentEditable={renaming}
            suppressContentEditableWarning
            onClick={onNameClick}
            onKeyDown={onNameKeyDown}
            onBlur={onRename}
          >
            { animation.name || '(Untitled)' }
          </div>
          <IconButton
            variant="ghost"
            size="1"
            className="flex-none"
            onClick={onToggleCollapsibleClick}
          >
            { opened ? <CaretDownIcon /> : <CaretRightIcon /> }
          </IconButton>
        </div>
        <div className="flex-none flex items-center gap-1">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger onClick={e => e.stopPropagation()}>
              <IconButton variant="ghost" size="1">
                <DotsVerticalIcon />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item onClick={onRenameClick}>
                Rename animation
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item onClick={onDeleteClick}>
                Delete animation
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </div>
      { opened && (
        <div className="px-3 pb-3">
          <div className="flex flex-col gap-2">
            <Text size="1" className="text-slate">Type</Text>
            <Select.Root
              value={animation.animationType || 'fixed'}
              onValueChange={onValueChange_.bind(null, 'animationType')}
            >
              <Select.Trigger placeholder="Select" />
              <Select.Content>
                <Select.Item value="fixed">Fixed</Select.Item>
                <Select.Item value="directions">4 directions</Select.Item>
                <Select.Item value="movements">
                  4 directions + Movement
                </Select.Item>
              </Select.Content>
            </Select.Root>
          </div>
        </div>
      ) }
    </div>
  );
};

export default AnimationsListItem;
