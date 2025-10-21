import { classNames } from '@junipero/react';

import { useEditor } from '../../services/hooks';

const Preview = () => {
  const { leftSidebarOpened, leftSidebarWidth } = useEditor();
  const scale = 2;

  return (
    <div
      className={classNames(
        'w-screen h-screen relative flex items-center justify-center',
        'bg-onyx',
      )}
      style={{
        ...(leftSidebarOpened ? { paddingLeft: leftSidebarWidth } : {}),
      }}
    >
      <div
        className="bg-black rounded-lg"
        style={{ width: 240 * scale, height: 160 * scale }}
      />
    </div>
  );
};

export default Preview;
