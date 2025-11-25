import type { GameActor, GameScript, GameSensor, GameSprite, GameVariable } from '../../../types';
import { useCanvas } from '../../services/hooks';
import Switch from '../../components/Switch';
import SceneForm from './SceneForm';
import ScriptForm from './ScriptForm';
import SensorForm from './SensorForm';
import ActorForm from './ActorForm';
import SpriteForm from './SpriteForm';
import VariableForm from './VariableForm';

const RightSidebar = () => {
  const {
    selectedScene,
    selectedItem,
    onSceneChange,
    onScriptChange,
    onVariableChange,
  } = useCanvas();

  return (
    <Switch value={selectedItem?.type || ''}>
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
      <Switch.Case value="variable">
        <VariableForm
          variable={selectedItem as GameVariable}
          onChange={onVariableChange}
        />
      </Switch.Case>
      <Switch.Case default>
        { selectedScene ? (
          <SceneForm
            scene={selectedScene}
            onChange={onSceneChange}
          />
        ) : (
          <div className="p-4">No selection</div>
        ) }
      </Switch.Case>
    </Switch>
  );
};

export default RightSidebar;
