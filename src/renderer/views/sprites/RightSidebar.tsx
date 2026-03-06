import { classNames } from '@junipero/react';
import {
  Heading,
  Inset,
  Select,
  Separator,
  Tabs,
  Text,
  TextField,
} from '@radix-ui/themes';

import { useSprite } from '../../services/hooks';

const RightSidebar = () => {
  const { selectedSprite } = useSprite();

  const spriteFile = selectedSprite?._file?.replace('.json', '');

  return (
    <>
      { selectedSprite ? (
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
              { selectedSprite?._file?.replace('.json', '') }
            </Heading>
            <Inset side="x"><Separator className="!w-full my-4" /></Inset>
          </div>

          <div className="flex-1 overflow-y-scroll h-auto">
            <p>Form</p>
          </div>

          <img
            src={`project://graphics/${spriteFile}.bmp`}
          />
        </div>
      ) : (
        <div className="p-4">No selection</div>
      ) }
    </>
  );
};

export default RightSidebar;
