import { useCallback, useMemo } from 'react';
import {
  Button,
  SegmentedControl,
  Select,
  Tabs,
  Text,
} from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import { classNames } from '@junipero/react';
import { v4 as uuid } from 'uuid';

import type {
  SpriteAnimation,
  SpriteAnimationFrame,
} from '../../../types';
import type { BottomBarTab } from '../../components/BottomBarTabs';
import { useSprite } from '../../services/hooks';
import FramesField from './FramesField';

const AnimationsTabTitle = () => (
  <Tabs.Trigger value="animations">Animations Editor</Tabs.Trigger>
);

const AnimationsTabContent = () => {
  const {
    selectedAnimation,
    selectedDirection,
    selectedStateName,
    animationsRegistry,
    selectAnimation,
    selectDirection,
    selectStateName,
    onAnimationsChange,
    onAddAnimation,
  } = useSprite();
  const animations = useMemo(() => (
    animationsRegistry?.animations
  ), [animationsRegistry]);

  const onSelectAnimation = useCallback((animationId: string) => {
    const animation = animations?.find(a => a.id === animationId);

    if (animation) {
      selectAnimation?.(animation);
    }
  }, [selectAnimation, animations]);

  const onAnimationChange = useCallback((animation: SpriteAnimation) => {
    if (!selectedAnimation) {
      return;
    }

    onAnimationsChange?.({
      ...animationsRegistry!,
      animations: animationsRegistry!.animations.map(a => (
        a.id === selectedAnimation.id ? animation : a
      )),
    });
  }, [selectedAnimation, onAnimationsChange, animationsRegistry]);

  const currentState = useMemo(() => (
    selectedAnimation?.animationType === 'fixed'
      ? selectedAnimation?.states?.fixed
      : (selectedAnimation?.states as Omit<SpriteAnimation['states'], 'fixed'>)
        ?.[selectedStateName || 'idle']
        ?.[selectedDirection || 'up']
  ), [selectedAnimation, selectedStateName, selectedDirection]);

  const frames = useMemo(() => (
    currentState?.frames || []
  ), [currentState]);

  const onFramesChange = useCallback((newFrames: SpriteAnimationFrame[]) => {
    if (!selectedAnimation) {
      return;
    }

    onAnimationChange({
      ...selectedAnimation,
      states: {
        ...selectedAnimation.states,
        ...selectedAnimation.animationType === 'fixed'
          ? { fixed: {
            ...selectedAnimation.states.fixed || {
              type: 'state',
              id: uuid(),
            },
            frames: newFrames,
          } }
          : {
            [selectedStateName || 'idle']: {
              ...selectedAnimation.states?.[selectedStateName || 'idle'],
              [selectedDirection || 'up']: {
                frames: newFrames,
              },
            },
          },
      },
    });

    selectAnimation?.(selectedAnimation);
  }, [
    onAnimationChange, selectAnimation,
    selectedAnimation,
    selectedDirection, selectedStateName,
  ]);

  return (
    <Tabs.Content
      value="animations"
    >
      <div
        className={classNames(
          'bg-(--gray-7) dark:bg-(--gray-1) flex items-center gap-4 py-2 px-3',
        )}
      >
        <Text>Animation</Text>
        { (animations?.length || 0) > 0 ? (
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
        ) : (
          <Button onClick={onAddAnimation}>
            <PlusIcon />
            <Text>Add</Text>
          </Button>
        ) }
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
            value={selectedDirection || 'up'}
            onValueChange={selectDirection}
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
            value={selectedStateName || 'idle'}
            onValueChange={selectStateName}
          >
            <SegmentedControl.Item value="idle">Idle</SegmentedControl.Item>
            <SegmentedControl.Item value="moving">Moving</SegmentedControl.Item>
          </SegmentedControl.Root>
        </div>
      ) }
      { selectedAnimation && (
        <>
          <div className="py-2 px-3">
            <Text>Frames</Text>
          </div>
          <FramesField
            value={frames}
            onValueChange={onFramesChange}
          />
        </>
      ) }
    </Tabs.Content>
  );
};

export default {
  id: 'animations',
  title: AnimationsTabTitle,
  content: AnimationsTabContent,
} satisfies BottomBarTab;
