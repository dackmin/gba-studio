import type { InfiniteCanvasCursorMode } from '@junipero/react';
import type { FC, ForwardRefExoticComponent } from 'react';

export type ProjectTemplate = '2d-sample' | 'blank';

export interface ViewDefinition {
  name?: string;
  title?: string;
  icon?: FC;
  view: FC;
  provider?: FC;
  leftSidebar?: FC;
  rightSidebar?: FC;
  bottomBar?: FC;
}

export interface RecentProject {
  name: string;
  path: string;
}

export interface AppStorage {
  recentProjects?: RecentProject[];
  buildConfiguration?: string;
  clipboard?: any;
}

export type VariableValue = string | number | boolean;

export type ToolType = InfiniteCanvasCursorMode | 'collisions';
export type AddSubToolType = 'scene' | 'sensor' | 'actor' | 'sprite' | 'hud' |
  'hud-sprite' | 'hud-text';
export type SubToolType = AddSubToolType;

export type CollisionBrush = 'normal' | 'slope-left' | 'slope-right';

export type CharacterDirection = 'up' | 'down' | 'left' | 'right';

export type ActorDirection =
  | CharacterDirection
  | 'towards_player'
  | 'from_player'
  // legacy
  | 'player';

export type MenuDirection =
  | CharacterDirection
  | 'up_left'
  | 'up_right'
  | 'down_left'
  | 'down_right';

export type Direction = ActorDirection | MenuDirection;

export interface ListItem {
  name: string;
  value: string;
  icon?: ForwardRefExoticComponent<any>;
}

export interface ListCategory<T extends ListItem = ListItem> {
  name: string;
  items: T[];
}

export type SpriteAnimationType = 'fixed' | 'directions' | 'movements';

export interface SpriteAnimationFrame {
  type: 'frame';
  index: number;
  reverse?: boolean;
  duration?: EventValue;
  // Internals
  id: string;
}

export interface SpriteAnimationState {
  type: 'state';
  frames: SpriteAnimationFrame[];
  // Internals
  id: string;
}

export interface SpriteAnimation {
  type: 'animation';
  name: string;
  animationType: SpriteAnimationType;
  states: {
    fixed?: SpriteAnimationState;
    idle?: {
      [key in CharacterDirection]?: SpriteAnimationState;
    };
    moving?: {
      [key in CharacterDirection]?: SpriteAnimationState;
    };
    hitting?: {
      [key in CharacterDirection]?: SpriteAnimationState;
    };
    firing?: {
      [key in CharacterDirection]?: SpriteAnimationState;
    };
  };
  // Internals
  id: string;
}

export interface SpriteAnimations {
  type: 'animations';
  gridSize?: number;
  animations: SpriteAnimation[];
  // Internals
  id: string;
  _sprite_file?: string;
  _file?: string;
  $schema?: string;
}

export interface InternalSpriteAnimation extends Omit<SpriteAnimationState, 'type'> {
  type: 'animation';
  animationType: SpriteAnimationType;
  name?: string;
  state?: AnimationType;
  direction?: CharacterDirection;
}

export interface GameVariable {
  type: 'variable';
  name: string;
  defaultValue: EventValue;
  // Internals
  id: string;
}

export interface GameVariables {
  type: 'variables';
  values: GameVariable[];
  // Internals
  id: string;
  _file?: string;
  $schema?: string;
}

export interface GameMap {
  type: 'map';
  width: number;
  height: number;
  gridSize: number;
  scene?: string;
  collisions?: string[][];
  sensors?: GameSensor[];
}

export interface GamePlayer {
  type: 'player';
  x: number;
  y: number;
  z?: number;
  width?: number;
  height?: number;
  direction?: CharacterDirection;
  sprite?: string;
  // Collision group (1-4, 0 = none): actors/sprites in a different
  // group are solid and fire their collide events on touch.
  collisionGroup?: number;
  // Adventure scenes only
  // Internals
  _spriteHasAnimations?: boolean;
}

export type GameSceneType =
  | 'logos'
  | '2d-top-down'
  | 'side-scroller'
  | 'point-and-click'
  | 'adventure';

export interface GameScene {
  type: 'scene';
  sceneType: GameSceneType;
  name: string;
  background?: string;
  player?: GamePlayer;
  cursor?: string;
  gravity?: boolean;
  map?: GameMap;
  events?: SceneEvent[];
  actors?: GameActor[];
  sprites?: GameSprite[];
  // Id of the HUD displayed over this scene
  hud?: string;
  // Internals
  id: string;
  _file?: string;
  $schema?: string;
}

export interface GameScript {
  type: 'script';
  name: string;
  parameters?: GameScriptParameter[];
  events?: SceneEvent[];
  // Internals
  id: string;
  _file?: string;
  $schema?: string;
}

export interface GameScriptParameter {
  id: string;
  name: string;
  type: 'value' | 'variable' | 'actor';
}

export interface GameActor {
  type: 'actor';
  name: string;
  x: number;
  y: number;
  z?: number;
  direction?: CharacterDirection;
  width?: number;
  height?: number;
  sprite: string;
  disableDirectionOnInteract?: boolean;
  // Collision group (1-4, 0 = none): actors/sprites in a different
  // group than the player are solid and fire collide events on touch.
  collisionGroup?: number;
  events?: {
    init?: SceneEvent[];
    interact?: SceneEvent[];
    update?: SceneEvent[];
    // Fired when the player touches this actor (different collision group)
    collide?: SceneEvent[];
    hit?: SceneEvent[];
  };
  // Internals
  _spriteHasAnimations?: boolean;
  id: string;
}

export interface GameSprite {
  type: 'sprite';
  name: string;
  sprite: string;
  width?: number;
  height?: number;
  x: number;
  y: number;
  z?: number;
  // Collision group (1-4, 0 = none): actors/sprites in a different
  // group than the player are solid and fire collide events on touch.
  collisionGroup?: number;
  events?: {
    init?: SceneEvent[];
    interact?: SceneEvent[];
    // Fired when the player touches this sprite (different collision group)
    collide?: SceneEvent[];
  };
  // Internals
  id: string;
}

// A HUD is a fixed GBA-screen-sized layer (240x160) that only holds sprites
// and texts. It is displayed over a scene and never moves with the camera.
export interface GameHud {
  type: 'hud';
  name: string;
  sprites?: GameHudSprite[];
  texts?: GameHudText[];
  events?: {
    init?: SceneEvent[];
    update?: SceneEvent[];
  };
  // Internals
  id: string;
  _file?: string;
  $schema?: string;
}

export interface GameHudSprite {
  type: 'hud-sprite';
  name: string;
  sprite: string;
  // Pixels from the top-left corner of the screen
  x: number;
  y: number;
  z?: number;
  // Internals
  id: string;
}

export interface GameHudText {
  type: 'hud-text';
  name: string;
  text: EventValue;
  x: number;
  y: number;
  z?: number;
  color?: string;
  font?: string;
  // Internals
  id: string;
}

export interface GameSensor {
  type: 'sensor';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  events?: {
    enter?: SceneEvent[];
    interact?: SceneEvent[];
    leave?: SceneEvent[];
  };
  // Internals
  id: string;
}

export interface ProjectSceneData {
  x: number;
  y: number;
  // Internals
  id?: string;
  _file?: string;
}

export interface ProjectSettings {
  pythonPath?: string;
  devkitProPath?: string;
  emulatorType?: 'internal' | 'external';
  emulatorCommand?: string;
  logsEnabled?: boolean;
  // Texts
  font?: string;
  textColor?: string;
  // Dialogs
  dialogSprite?: string;
  dialogPaddingTop?: number;
  dialogPaddingBottom?: number;
  dialogPaddingLeft?: number;
  dialogPaddingRight?: number;
  dialogMarginTop?: number;
  dialogMarginBottom?: number;
  dialogMarginLeft?: number;
  dialogMarginRight?: number;
  dialogPortraitGap?: number;
  // Menus
  menuSprite?: string;
  menuPaddingTop?: number;
  menuPaddingBottom?: number;
  menuPaddingLeft?: number;
  menuPaddingRight?: number;
  menuMarginTop?: number;
  menuMarginBottom?: number;
  menuMarginLeft?: number;
  menuMarginRight?: number;
  menuArrowGap?: number;
}

export interface ProjectConfiguration {
  id: string;
  name?: string;
  settings?: ProjectSettings;
}

export interface GameProject {
  name: string;
  romName: string;
  romCode: string;
  scenes: ProjectSceneData[];
  // Canvas positions of the HUDs
  huds?: ProjectSceneData[];
  settings?: ProjectSettings;
  configurations?: ProjectConfiguration[];
  startingScene?: string;
  // Internal
  id?: string;
}

export interface GameSpriteFile {
  type: 'sprite';
  name: string;
  path: string;
  width?: number;
  height?: number;
  transparentColor?: string;
  format?: string;
  animations?: SpriteAnimation[];
  // Internals
  id?: string;
  _realWidth?: number;
  _realHeight?: number;
  _file?: string;
  _fileName?: string;
  _version?: number;
  _animations?: InternalSpriteAnimation[];
  $schema?: string;
}

export interface BackgroundTile {
  name: string;
  col: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BackgroundLayout {
  mode: 'single' | 'big' | 'tiles';
  width: number;
  height: number;
  tiles: BackgroundTile[];
}

export interface GameBackgroundFile {
  type: 'background';
  name: string;
  path: string;
  width?: number;
  height?: number;
  format?: string;
  // Internals
  id?: string;
  _realWidth?: number;
  _realHeight?: number;
  _layout?: BackgroundLayout;
  _file?: string;
  _fileName?: string;
  _version?: number;
  $schema?: string;
}

export interface GameSoundFile {
  type: 'sound';
  name: string;
  path: string;
  format?: string;
  // Internals
  id?: string;
  _file?: string;
  _fileName?: string;
  $schema?: string;
}

export interface GameMusicFile {
  type: 'music';
  name: string;
  path: string;
  format?: string;
  // Internals
  id?: string;
  _file?: string;
  _fileName?: string;
  $schema?: string;
}

export interface GameFontFile {
  type: 'font';
  name: string;
  path: string;
  width?: number;
  height?: number;
  transparentColor?: string;
  format?: string;
  // Internals
  id?: string;
  _realWidth?: number;
  _realHeight?: number;
  _file?: string;
  _fileName?: string;
  _version?: number;
  $schema?: string;
}

export declare interface AppPayload {
  project: GameProject;
  scenes: GameScene[];
  huds: GameHud[];
  variables: GameVariables[];
  sprites: GameSpriteFile[];
  backgrounds: GameBackgroundFile[];
  fonts: GameFontFile[];
  music: GameMusicFile[];
  sounds: GameSoundFile[];
  scripts: GameScript[];
  // Internals
  _recoveredAutosave?: boolean;
};

export declare interface AutoSavePayload {
  $autosave: true;
  version: number;
  savedAt: number;
  projectPath: string;
  data: Partial<AppPayload>;
}

export interface AnyDynamic {
  type: string;
  name?: string;
}

export interface DynamicVariableValue extends AnyDynamic {
  type: 'variable';
}

export interface DynamicSavedGameValue extends AnyDynamic {
  type: 'saved-game';
}

export interface DynamicPlayerAttributeValue extends AnyDynamic {
  type: 'player-attribute';
}

export interface DynamicDirectionValue extends AnyDynamic {
  type: 'direction';
}

export interface DynamicCollisionSideValue extends AnyDynamic {
  type: 'collision-side';
}

export interface DynamicSceneValue extends AnyDynamic {
  type: 'scene';
}

export interface DynamicActorValue extends AnyDynamic {
  type: 'actor';
}

export type DynamicValue =
  | DynamicVariableValue
  | DynamicSavedGameValue
  | DynamicPlayerAttributeValue
  | DynamicDirectionValue
  | DynamicCollisionSideValue
  | DynamicSceneValue
  | DynamicActorValue;

export type EventValue =
  | string
  | number
  | boolean
  | DynamicValue;

export interface SceneEvent {
  type: string;
  enabled?: boolean;
  name?: string;
  // Internals
  id: string;
  _name?: string;
}

export interface WaitEvent extends SceneEvent {
  type: 'wait';
  duration: EventValue;
}

export interface FadeInEvent extends SceneEvent {
  type: 'fade-in';
  duration: EventValue;
}

export interface FadeOutEvent extends SceneEvent {
  type: 'fade-out';
  duration: EventValue;
}

export interface GoToSceneEvent extends SceneEvent {
  type: 'go-to-scene';
  target: string;
  start?: {
    x?: EventValue;
    y?: EventValue;
    direction?: Direction;
  };
}

export interface PlayMusicEvent extends SceneEvent {
  type: 'play-music';
  name: string;
  volume?: number;
  loop?: boolean;
}

export interface StopMusicEvent extends SceneEvent {
  type: 'stop-music';
}

export interface PlaySoundEvent extends SceneEvent {
  type: 'play-sound';
  name: string;
  volume?: number;
  speed?: number;
  pan?: number;
  priority?: number;
}

export interface WaitForButtonEvent extends SceneEvent {
  type: 'wait-for-button';
  buttons: string[];
  every?: boolean;
}

export interface OnButtonPressEvent extends SceneEvent {
  type: 'on-button-press';
  buttons: string[];
  events?: SceneEvent[];
}

export interface SetHudTextEvent extends SceneEvent {
  type: 'set-hud-text';
  // HUD id, empty means the HUD the event is used in
  hud: string;
  // Id of the HUD text to update
  text: string;
  value: EventValue;
}

export interface OnVariableChangeEvent extends SceneEvent {
  type: 'on-variable-change';
  variable: string;
  events?: SceneEvent[];
}

export interface ParallelEventsEvent extends SceneEvent {
  type: 'parallel-events';
  events: SceneEvent[];
}

export type PaletteEffectTarget = 'background' | 'sprite' | 'both';

export type PaletteEffectType =
  | 'brightness'
  | 'contrast'
  | 'intensity'
  | 'grayscale'
  | 'hue-shift';

export interface SetPaletteEffectEvent extends SceneEvent {
  type: 'set-palette-effect';
  target: PaletteEffectTarget;
  effect: PaletteEffectType;
  value: number;
  duration?: EventValue;
}

export type WaveEnvelope = 'in' | 'in-out' | 'out';

export interface WaveEffectEvent extends SceneEvent {
  type: 'wave-effect';
  target: PaletteEffectTarget;
  // In pixels.
  amplitude?: number;
  // Degrees of phase advanced per frame.
  speed?: number;
  // Number of full sine cycles across the screen.
  frequency?: number;
  // In milliseconds (0 = runs until the scene changes).
  duration?: EventValue;
  // Amplitude ramp: "in" (0%->100%) or "in-out" (0%->100%->0%).
  envelope?: WaveEnvelope;
}

export interface SetVariableEvent extends SceneEvent {
  type: 'set-variable';
  name: string;
  value: EventValue;
  operation?: 'set' | 'increment' | 'decrement';
}

export interface ShowDialogEvent extends SceneEvent {
  type: 'show-dialog';
  text: string;
  direction?: Direction;
  z?: number;
  speed?: 'slow' | 'normal' | 'fast';
  portrait?: string;
  portraitPosition?: 'left' | 'right';
  font?: string;
  textColor?: string;
  background?: string;
}

export interface DisableActorEvent extends SceneEvent {
  type: 'disable-actor';
  actor: string;
}

export interface EnableActorEvent extends SceneEvent {
  type: 'enable-actor';
  actor: string;
}

export interface DisableSpriteEvent extends SceneEvent {
  type: 'disable-sprite';
  sprite: string;
}

export interface EnableSpriteEvent extends SceneEvent {
  type: 'enable-sprite';
  sprite: string;
}

export interface DisablePlayerEvent extends SceneEvent {
  type: 'disable-player';
}

export interface EnablePlayerEvent extends SceneEvent {
  type: 'enable-player';
}

export type DirectionPriority = 'horizontal' | 'vertical';

export interface MoveCameraToEvent extends SceneEvent {
  type: 'move-camera-to';
  x: EventValue;
  y: EventValue;
  duration?: EventValue;
  allowDiagonal?: boolean;
  directionPriority?: DirectionPriority;
}

export interface FollowActorEvent extends SceneEvent {
  type: 'follow-actor';
  actor: string;
  duration?: EventValue;
  allowDiagonal?: boolean;
  directionPriority?: DirectionPriority;
}

export interface FollowPlayerEvent extends SceneEvent {
  type: 'follow-player';
  duration?: EventValue;
  allowDiagonal?: boolean;
  directionPriority?: DirectionPriority;
}

export interface FreezeCameraEvent extends SceneEvent {
  type: 'freeze-camera';
}

export interface MoveActorToEvent extends SceneEvent {
  type: 'move-actor-to';
  actor: string;
  x: EventValue;
  y: EventValue;
  speed?: EventValue;
  directionPriority?: DirectionPriority;
  animation?: string;
  backwards?: boolean;
}

export interface MovePlayerToEvent extends SceneEvent {
  type: 'move-player-to';
  x: EventValue;
  y: EventValue;
  speed?: EventValue;
  directionPriority?: DirectionPriority;
  animation?: string;
  backwards?: boolean;
}

export interface SetActorPositionEvent extends SceneEvent {
  type: 'set-actor-position';
  actor: string;
  x: EventValue;
  y: EventValue;
}

export interface SetPlayerPositionEvent extends SceneEvent {
  type: 'set-player-position';
  x: EventValue;
  y: EventValue;
}

export interface SaveGameEvent extends SceneEvent {
  type: 'save-game';
}

export interface LoadGameEvent extends SceneEvent {
  type: 'load-game';
}

export interface SaveStateEvent extends SceneEvent {
  type: 'save-state';
}

export interface LoadStateEvent extends SceneEvent {
  type: 'load-state';
}

export interface ResetGameEvent extends SceneEvent {
  type: 'reset-game';
}

export interface GameMenuChoice {
  type: 'menu-choice';
  text: string;
  events: SceneEvent[];
  conditions?: IfEventCondition[];
  // Internals
  id: string;
}

export interface ShowMenuEvent extends SceneEvent {
  type: 'show-menu';
  choices: GameMenuChoice[];
  direction?: Direction;
  z?: number;
  font?: string;
  textColor?: string;
  background?: string;
}

export interface IfEventCondition {
  type: 'condition';
  left: EventValue | IfEventCondition;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | '&&' | '||';
  right: EventValue | IfEventCondition;
}

export interface IfEvent extends SceneEvent {
  type: 'if';
  conditions: IfEventCondition[];
  then?: SceneEvent[];
  else?: SceneEvent[];
}

export interface ExecuteScriptEvent extends SceneEvent {
  type: 'execute-script';
  script: string;
  parameters?: EventValue[];
}

export interface SetActorDirectionEvent extends SceneEvent {
  type: 'set-actor-direction';
  actor: string;
  direction: ActorDirection;
}

export interface SetPlayerDirectionEvent extends SceneEvent {
  type: 'set-player-direction';
  direction: CharacterDirection;
}

export interface SetBackgroundEvent extends SceneEvent {
  type: 'set-background';
  background: string;
}

export interface SetSpriteEvent extends SceneEvent {
  type: 'set-sprite';
  sprite: string;
  asset: string;
}

export interface ShootProjectileEvent extends SceneEvent {
  type: 'shoot-projectile';
  sourceType: 'actor' | 'player';
  sprite: string;
  actor?: string;
  speed?: number;
  hasGravity?: boolean;
  gravity?: number;
  gravityStyle?: 'normal' | 'arc' | 'sinus' | 'custom';
  gravityAngle?: number;
  terminalVelocity?: number;
  lifetime?: number;
  collisionGroup?: number;
  animation?: string;
  direction?: Direction | ActorDirection;
  destroyOnCollision?: boolean;
}

export interface MeleeAttackEvent extends SceneEvent {
  type: 'melee-attack';
  sourceType: 'actor' | 'player';
  sprite: string;
  actor?: string;
  duration?: EventValue;
}

export type AnimationType = 'idle' | 'moving' | 'hitting' | 'firing';

export type FramesDefinition = {
  [key in AnimationType]: {
    [key in CharacterDirection]: Partial<SpriteAnimationFrame>[];
  };
};

export interface BuildOptions {
  clean?: boolean;
}

export interface Build {
  id: string;
  projectPath: string;
  configurationName?: string;
  controller?: AbortController;
  data?: Partial<AppPayload>;
  opts?: BuildOptions;
  events: {
    onLog: (...args: any[]) => void;
    onStep: (...args: any[]) => void;
    onError: (...args: any[]) => void;
    onSuccess: (...args: any[]) => void;
    onAbort: (...args: any[]) => void;
    onStart: (...args: any[]) => void;
    onComplete: (...args: any[]) => void;
  }
}

export interface LogMessage {
  id: string;
  type?: 'log' | 'error' | 'success';
  message: string;
  messageId: string;
  time?: number;
}

export interface SpriteBitmap {
  data: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  isResized: boolean;
  tiles: number;
  layout?: BackgroundLayout;
  loadedTiles?: number;
  transparentColor: [number, number, number];
  mime?: string;
}

export interface VariableUpdate {
  event: SetVariableEvent;
  trigger: string;
  scene?: GameScene;
  script?: GameScript;
  hud?: GameHud;
  owner?: GameActor | GameSprite | GameSensor;
}
