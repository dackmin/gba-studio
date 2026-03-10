import { useMemo } from 'react';
import { Heading, Inset, Select, Separator, Text } from '@radix-ui/themes';
import { classNames } from '@junipero/react';

import { useSprite } from '../../services/hooks';
import { getTilesCount } from '../../../helpers';

const FrameForm = () => {
  // const { animations } = useApp();
  const { selectedSprite, selectedFrame } = useSprite();

  // const animationsRegistry = useMemo(() => (
  //   animations.find(a => a._sprite_file === selectedSprite?._file)
  // ), [animations, selectedSprite]);

  const availableTiles = useMemo(() => (
    Array.from({
      length: getTilesCount(selectedSprite?.width, selectedSprite?.height),
    })
  ), [selectedSprite]);

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
            'outline-(--accent-9) rounded-xs',
          )}
        >
          Frame { selectedFrame?.index || 0 }
        </Heading>
        <Inset side="x"><Separator className="!w-full my-4" /></Inset>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Text className="block text-slate" size="1">Tile index</Text>
            { '' + (selectedFrame?.index || 0) }
            <Select.Root
              value={'' + (selectedFrame?.index || 0)}
              onValueChange={() => {}}
            >
              <Select.Trigger placeholder="Select" />
              <Select.Content>
                { availableTiles.map((_, index) => (
                  <Select.Item key={index} value={'' + index}>
                    { index }
                  </Select.Item>
                )) }
              </Select.Content>
            </Select.Root>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrameForm;
