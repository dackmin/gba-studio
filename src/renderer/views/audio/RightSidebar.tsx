import { useMemo } from 'react';

import { useAudio } from '../../services/hooks';
import Switch from '../../components/Switch';
import SoundForm from './SoundForm';
import MusicForm from './MusicForm';

const RightSidebar = () => {
  const { selectedSound, selectedMusic } = useAudio();

  const selectedItem = useMemo(() => (
    selectedSound || selectedMusic
  ), [selectedSound, selectedMusic]);

  return (
    <Switch value={selectedItem?.type || ''}>
      <Switch.Case value="sound">
        <SoundForm />
      </Switch.Case>
      <Switch.Case value="music">
        <MusicForm />
      </Switch.Case>
      <Switch.Case default>
        <div className="p-4">No selection</div>
      </Switch.Case>
    </Switch>
  );
};

export default RightSidebar;
