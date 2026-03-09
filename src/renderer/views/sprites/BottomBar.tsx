import { Select, Text } from '@radix-ui/themes';
import { useEditor, useSprite } from '../../services/hooks';

const BottomBar = () => {
  const { leftSidebarOpened, leftSidebarWidth } = useEditor();
  const { selectedAnimation, animationsRegistry } = useSprite();
  const { animations } = animationsRegistry || {};

  return (
    <div
      style={{
        ...leftSidebarOpened && { paddingLeft: leftSidebarWidth },
      }}
    >
      <div className="flex items-center gap-4 py-2 px-3">
        <Text>Animation</Text>
        <Select.Root value={selectedAnimation?.id || animations?.[0]?.id}>
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
      <div className="bg-(--gray-2) flex items-center gap-4 py-2 px-3">
        <Text>State</Text>
      </div>
    </div>
  )
};

export default BottomBar;
