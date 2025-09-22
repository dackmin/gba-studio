import { Button } from '@radix-ui/themes';

const ProjectSelection = () => {
  const onClick = async () => {
    await window.electron.openFileDialog();
    window.close();
  };

  return (
    <div className="flex items-stretch w-screen h-screen">
      <div className="flex-none bg-mischka dark:bg-gondola">
        <Button onClick={onClick}>Open</Button>
      </div>
      <div className="flex-auto"></div>
    </div>
  );
};

export default ProjectSelection;
