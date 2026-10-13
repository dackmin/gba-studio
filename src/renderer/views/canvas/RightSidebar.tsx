import { Text } from '@radix-ui/themes';

import type {
  GameActor,
  GameHudSprite,
  GamePlayer,
  GameScript,
  GameSensor,
  GameSprite,
  GameVariable,
} from '../../../types';
import { useCanvas } from '../../services/hooks';
import { HudFormContext } from '../../services/contexts';
import Switch from '../../components/Switch';
import SceneForm from './SceneForm';
import ScriptForm from './ScriptForm';
import SensorForm from './SensorForm';
import ActorForm from './ActorForm';
import SpriteForm from './SpriteForm';
import VariableForm from './VariableForm';
import PlayerForm from './PlayerForm';
import HudForm from './HudForm';
import HudSpriteForm from './HudSpriteForm';

const RightSidebar = () => {
  const {
    selectedScene,
    selectedHud,
    selectedItem,
    onSceneChange,
    onHudChange,
    onScriptChange,
    onVariableChange,
  } = useCanvas();

  return (
    <Switch value={selectedItem?.type || ''}>
      <Switch.Case value="player">
        <PlayerForm
          player={selectedItem as GamePlayer}
          onChange={onSceneChange}
        />
      </Switch.Case>
      <Switch.Case value="script">
        <ScriptForm
          script={selectedItem as GameScript}
          onChange={onScriptChange}
        />
      </Switch.Case>
      <Switch.Case value="sensor">
        <SensorForm
          sensor={selectedItem as GameSensor}
          onChange={onSceneChange}
        />
      </Switch.Case>
      <Switch.Case value="actor">
        <ActorForm
          actor={selectedItem as GameActor}
          onChange={onSceneChange}
        />
      </Switch.Case>
      <Switch.Case value="sprite">
        <SpriteForm
          sprite={selectedItem as GameSprite}
          onChange={onSceneChange}
        />
      </Switch.Case>
      <Switch.Case value="hud-sprite">
        <HudSpriteForm
          sprite={selectedItem as GameHudSprite}
          onChange={onHudChange}
        />
      </Switch.Case>
      <Switch.Case value="variable">
        <VariableForm
          variable={selectedItem as GameVariable}
          onChange={onVariableChange}
        />
      </Switch.Case>
      <Switch.Case default>
        { selectedHud ? (
          <HudFormContext value={{ hud: selectedHud }}>
            <HudForm
              hud={selectedHud}
              onChange={onHudChange}
            />
          </HudFormContext>
        ) : selectedScene ? (
          <SceneForm
            scene={selectedScene}
            onChange={onSceneChange}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4">
            <Text size="1" className="text-slate">No selection</Text>
          </div>
        ) }
      </Switch.Case>
    </Switch>
  );
};

export default RightSidebar;
