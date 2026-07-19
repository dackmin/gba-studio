import { IconButton, Text } from '@radix-ui/themes';
import {
  PauseIcon,
  PlayIcon,
  StopIcon,
  TrackNextIcon,
  TrackPreviousIcon,
} from '@radix-ui/react-icons';
import { classNames } from '@junipero/react';

import { useEditor, usePlayback } from '../../services/hooks';

const Playback = () => {
  const { leftSidebarWidth, bottomBarHeight } = useEditor();
  const { playing, index, play, pause, stop, jumpToStart, jumpToEnd } = usePlayback();

  return (
    <div
      style={{
        left: leftSidebarWidth + 10,
        bottom: bottomBarHeight + 10,
      }}
      className={classNames(
        'fixed! z-20 bg-(--gray-7) dark:bg-(--gray-1) rounded-sm p-2.5 flex items-center gap-3',
      )}
    >
      <IconButton
        variant="ghost"
        color="gray"
        onClick={jumpToStart}
      >
        <TrackPreviousIcon />
      </IconButton>
      <IconButton
        variant="ghost"
        color="gray"
        onClick={playing ? pause : play}
      >
        { playing ? <PauseIcon /> : <PlayIcon /> }
      </IconButton>
      <IconButton
        variant="ghost"
        color="gray"
        disabled={!playing}
        onClick={stop}
      >
        <StopIcon />
      </IconButton>
      <IconButton
        variant="ghost"
        color="gray"
        onClick={jumpToEnd}
      >
        <TrackNextIcon />
      </IconButton>
      <Text color="gray" size="2">
        { index }
      </Text>
    </div>
  );
};

export default Playback;
