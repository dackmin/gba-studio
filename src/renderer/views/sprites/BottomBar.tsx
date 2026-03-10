import { useCallback, useMemo, useReducer } from 'react';
import {
  Card,
  IconButton,
  SegmentedControl,
  Select,
  Text,
} from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import { classNames, mockState } from '@junipero/react';

import type {
  CharacterDirection,
  SpriteAnimation,
  SpriteAnimationFrame,
} from '../../../types';
import { useEditor, useSprite } from '../../services/hooks';
import Sprite from '../../components/Sprite';

export interface BottomBarState {
  selectedDirection?: CharacterDirection;
  selectedState?: Exclude<keyof SpriteAnimation['states'], 'fixed'>;
}

const BottomBar = () => {
  const { leftSidebarOpened, leftSidebarWidth } = useEditor();
  const {
    selectedSprite,
    selectedAnimation,
    selectedFrame,
    animationsRegistry,
    selectAnimation,
    selectFrame,
  } = useSprite();
  const animations = useMemo(() => (
    animationsRegistry?.animations
  ), [animationsRegistry]);
  const [state, dispatch] = useReducer(mockState<BottomBarState>, {
    selectedDirection: 'up',
    selectedState: 'idle',
  });

  const onValueChange = (name: string, value: string) => {
    dispatch({ [name]: value });
  };

  const onSelectAnimation = useCallback((animationId: string) => {
    const animation = animations?.find(a => a.id === animationId);

    if (animation) {
      selectAnimation?.(animation);
    }
  }, [selectAnimation, animations]);

  const currentState = useMemo(() => (
    selectedAnimation?.animationType === 'fixed'
      ? selectedAnimation?.states?.fixed
      : (selectedAnimation?.states as Omit<SpriteAnimation['states'], 'fixed'>)
        ?.[state.selectedState || 'idle']
        ?.[state.selectedDirection || 'up']
  ), [selectedAnimation, state.selectedState, state.selectedDirection]);

  const frames = useMemo(() => (
    currentState?.frames || [{
      type: 'frame',
      index: 0,
    } as SpriteAnimationFrame]
  ), [currentState]);

  return (
    <div
      style={{
        ...leftSidebarOpened && { paddingLeft: leftSidebarWidth },
      }}
    >
      <div
        className={classNames(
          'bg-(--gray-7) dark:bg-(--gray-1) flex items-center gap-4 py-2 px-3',
        )}
      >
        <Text>Animation</Text>
        <Select.Root
          value={selectedAnimation?.id || animations?.[0]?.id || ''}
          onValueChange={onSelectAnimation}
        >
          <Select.Trigger placeholder="Select" />
          <Select.Content>
            { animations?.map(anim => (
              <Select.Item key={anim.id} value={anim.id}>
                { anim.name }
              </Select.Item>
            )) }
          </Select.Content>
        </Select.Root>
      </div>
      { ['directions', 'movements']
        .includes(selectedAnimation?.animationType || 'fixed') && (
        <div
          className={classNames(
            'bg-(--gray-6) dark:bg-(--gray-2) py-2 px-3 flex items-center',
            'gap-4',
          )}
        >
          <Text>Direction</Text>
          <SegmentedControl.Root
            value={state.selectedDirection || 'up'}
            onValueChange={onValueChange.bind(null, 'selectedDirection')}
          >
            <SegmentedControl.Item value="up">Up</SegmentedControl.Item>
            <SegmentedControl.Item value="down">Down</SegmentedControl.Item>
            <SegmentedControl.Item value="left">Left</SegmentedControl.Item>
            <SegmentedControl.Item value="right">Right</SegmentedControl.Item>
          </SegmentedControl.Root>
        </div>
      ) }
      { selectedAnimation?.animationType === 'movements' && (
        <div
          className={classNames(
            'bg-mischka dark:bg-gondola flex items-center gap-4 py-2 px-3',
          )}
        >
          <Text>State</Text>
          <SegmentedControl.Root
            value={state.selectedState || 'idle'}
            onValueChange={onValueChange.bind(null, 'selectedState')}
          >
            <SegmentedControl.Item value="idle">Idle</SegmentedControl.Item>
            <SegmentedControl.Item value="moving">Moving</SegmentedControl.Item>
          </SegmentedControl.Root>
        </div>
      ) }
      <div className="py-2 px-3">
        <Text>Frames</Text>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto py-2 px-3">
        { frames.map((frame, index) => (
          <Card
            key={frame.id || index}
            className={classNames(
              'w-16 h-16 !p-0 cursor-pointer',
              {
                'outline-2 outline-(--accent-9)':
                  selectedFrame === frame,
              }
            )}
            onClick={selectFrame?.bind(null, frame)}
          >
            <Sprite
              sprite={selectedSprite}
              frame={frame.index}
              className="!w-full !h-full"
            />
          </Card>
        )) }
        <Card className="w-16 h-16 !p-0">
          <IconButton
            variant="ghost"
            className="!w-full !h-full cursor-pointer"
            onClick={() => {}}
          >
            <PlusIcon />
          </IconButton>
        </Card>
      </div>
    </div>
  );
};

export default BottomBar;
