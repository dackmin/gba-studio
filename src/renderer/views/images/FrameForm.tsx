import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Heading,
  Inset,
  SegmentedControl,
  Select,
  Separator,
  Text,
  TextField,
} from '@radix-ui/themes';
import { classNames, set } from '@junipero/react';
import { v4 as uuid } from 'uuid';

import type { EventValue, SpriteAnimation } from '../../../types';
import { usePlayback, useSprite } from '../../services/hooks';
import { getTilesCount, loadImage } from '../../../helpers';
import EventValueField from '../../components/EventValueField';

const FrameForm = () => {
  const {
    selectedAnimation,
    selectedStateName,
    selectedDirection,
    selectedSprite,
    selectedFrame,
    selectFrame,
    onAnimationsChange,
  } = useSprite();
  const { jumpTo } = usePlayback();
  const [size, setSize] = useState([0, 0]);
  const [loading, setLoading] = useState(true);

  const init = useCallback(async () => {
    const image = selectedSprite?.path?.startsWith('data:')
      ? await loadImage(selectedSprite.path)
      : await loadImage(!selectedSprite?._file
        ? `resources://public/templates/commons/graphics/sprite_default.bmp`
        : `project://${selectedSprite.path}`);

    setSize([image.width, image.height]);
    setLoading(false);
  }, [selectedSprite]);

  useEffect(() => {
    init();
  }, [init]);

  const availableTiles = useMemo(() => (
    Array.from({
      length: getTilesCount(
        size[0],
        size[1],
        selectedSprite?.width,
        selectedSprite?.height,
      ),
    }).map((_, index) => index)
  ), [size, selectedSprite]);

  const onAnimationChange = useCallback((animation: SpriteAnimation) => {
    if (!selectedAnimation || !selectedSprite) {
      return;
    }

    onAnimationsChange?.({
      ...selectedSprite,
      animations: selectedSprite.animations?.map(a => (
        a.id === selectedAnimation.id ? animation : a
      )),
    });
  }, [selectedAnimation, selectedSprite, onAnimationsChange]);

  const onValueChange = useCallback((name: string, value: string | number | EventValue) => {
    const animation = selectedAnimation || {
      type: 'animation',
      name: 'New Animation',
      animationType: 'fixed',
      states: {},
      // Internals
      id: uuid(),
    } as SpriteAnimation;

    set(selectedFrame, name, value);
    selectFrame?.(selectedFrame);

    const newFrames = animation.animationType === 'fixed'
      ? animation.states?.fixed?.frames.map(frame => (
        frame.id === selectedFrame?.id
          ? { ...frame, [name]: value }
          : frame
      ))
      : animation.states?.[selectedStateName || 'idle']
        ?.[selectedDirection || 'up']?.frames.map(frame => (
          frame.id === selectedFrame?.id
            ? { ...frame, [name]: value }
            : frame
        ));

    if (!newFrames) {
      return;
    }

    jumpTo(newFrames.findIndex(frame => frame.id === selectedFrame?.id) || 0);

    onAnimationChange({
      ...animation,
      states: {
        ...animation.states,
        ...(animation.animationType === 'fixed'
          ? { fixed: {
            ...animation.states?.fixed || {
              type: 'state',
              id: uuid(),
            },
            frames: newFrames,
          } }
          : {
            [selectedStateName || 'idle']: {
              ...animation.states?.[selectedStateName || 'idle'],
              [selectedDirection || 'up']: {
                type: 'state',
                id: uuid(),
                frames: newFrames,
              },
            },
          }),
      },
    });
  }, [
    onAnimationChange, selectFrame, jumpTo,
    selectedAnimation, selectedStateName, selectedDirection, selectedFrame,
  ]);

  if (loading) {
    return null;
  }

  return (
    <div
      className={classNames(
        'p-3 w-full h-full',
        'flex flex-col gap-4 justify-between',
      )}
    >
      <div className="">
        <Text size="1" className="text-slate">Sprite</Text>
        <Heading
          as="h2"
          size="4"
          className={classNames(
            'whitespace-nowrap overflow-scroll focus:outline-2',
            'outline-(--accent-9) rounded-xs editable',
          )}
        >
          Frame { selectedFrame?.index || 0 }
        </Heading>
        <Inset side="x"><Separator className="!w-full my-4" /></Inset>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Text className="block text-slate" size="1">Tile index</Text>
            <Select.Root
              value={'' + (selectedFrame?.index || 0)}
              onValueChange={onValueChange.bind(null, 'index')}
            >
              <Select.Trigger placeholder="Select" />
              <Select.Content>
                { availableTiles.map(value => (
                  <Select.Item key={value} value={'' + value}>
                    Tile { value }
                  </Select.Item>
                )) }
              </Select.Content>
            </Select.Root>
          </div>
          <div className="flex flex-col gap-2">
            <Text className="block text-slate" size="1">Duration</Text>
            <EventValueField
              type="number"
              min={0}
              value={selectedFrame?.duration}
              defaultValue={100}
              onValueChange={onValueChange.bind(null, 'duration')}
            >
              <TextField.Slot side="right">
                ms
              </TextField.Slot>
            </EventValueField>
          </div>
          <div className="flex flex-col gap-2">
            <Text className="block text-slate" size="1">Reverse horizontally</Text>
            <SegmentedControl.Root
              size="1"
              value={'' + (selectedFrame?.reverse ?? false)}
              onValueChange={onValueChange.bind(null, 'reverse')}
            >
              <SegmentedControl.Item value="false">
                No
              </SegmentedControl.Item>
              <SegmentedControl.Item value="true">
                Yes
              </SegmentedControl.Item>
            </SegmentedControl.Root>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrameForm;
