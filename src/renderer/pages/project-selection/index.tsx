import { MouseEvent, useCallback, useEffect, useReducer } from 'react';
import { classNames, mockState } from '@junipero/react';
import { Button, Card, Heading, Text } from '@radix-ui/themes';
import { Cross2Icon } from '@radix-ui/react-icons';

import type { RecentProject } from '../../../types';
import pkg from '../../../../package.json' with { type: 'json' };
import icon from '../../../../public/icon.svg?url';

export interface ProjectSelectionState {
  recentProjects: RecentProject[];
  selectedProject?: RecentProject;
}

const ProjectSelection = () => {
  const [state, dispatch] = useReducer(mockState<ProjectSelectionState>, {
    recentProjects: [],
    selectedProject: undefined,
  });

  const onCreate = () => {

  };

  const onOpenExisting = async () => {
    await window.electron.openFileDialog();
  };

  const getRecentProjects = useCallback(async () => {
    const projects = await window.electron.getRecentProjects();
    dispatch({ recentProjects: projects, selectedProject: projects[0] });
  }, []);

  useEffect(() => {
    getRecentProjects();
  }, [getRecentProjects]);

  const onClose = () => {
    window.close();
  };

  const onSelectProject = (
    project: RecentProject,
    e: MouseEvent<HTMLAnchorElement>
  ) => {
    if (e.detail >= 2) {
      window.electron.openRecentProject(project.path);

      return;
    }

    dispatch({ selectedProject: project });
  };

  return (
    <div
      className={classNames(
        'flex items-stretch relative w-screen h-screen',
        'app-drag',
      )}
    >
      <a
        className={classNames(
          'rounded-full block w-4 h-4 flex items-center justify-center',
          'absolute top-4 left-4 app-no-drag bg-alabaster dark:bg-nevada',
          'hover:bg-mischka hover:dark:bg-slate group transition-all',
          'duration-200 ease-in-out',
        )}
        onClick={onClose}
      >
        <Cross2Icon
          width={12}
          height={12}
          className="[&_path]:fill-seashell dark:[&_path]:fill-onyx"
        />
      </a>
      <div
        className={classNames(
          'flex-auto flex flex-col items-center p-8 gap-4'
        )}
      >
        <div
          className={classNames(
            'w-[100px] aspect-square bg-alabaster dark:bg-nevada rounded-2xl',
            'mt-12'
          )}
          style={{
            backgroundImage: `url(${icon})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="text-center">
          <Heading as="h1">GBA Studio</Heading>
          <Text>v{ pkg.version }</Text>
        </div>
        <div className="mt-12 flex flex-col items-stretch gap-2">
          <Button
            variant="solid"
            onClick={onCreate}
            className="!app-no-drag"
          >
            <Text>Create a new project</Text>
          </Button>
          <div>
            <Button
              variant="soft"
              onClick={onOpenExisting}
              className="!app-no-drag"
            >
              <Text>Open an existing project</Text>
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-none w-[300px] p-2">
        <Card
          className={classNames(
            'h-full app-no-drag !rounded-[20px] before:!rounded-[20px]',
            'after:!rounded-[20px]',
          )}
        >
          <div className="flex flex-col gap-2">
            { state.recentProjects.length > 0
              ? state.recentProjects.map(project => (
                <a
                  key={project.path}
                  className={classNames(
                    'block p-3 hover:bg-(--accent-9) rounded-xl select-none',
                    'cursor-pointer',
                    { 'bg-(--accent-9)': state.selectedProject === project },
                  )}
                  onClick={onSelectProject.bind(null, project)}
                >
                  <div className="truncate text-ellipsis">{ project.name }</div>
                  <div className="truncate text-ellipsis">
                    <Text size="1">{ project.path }</Text>
                  </div>
                </a>
              )) : (
                <div className="flex items-center justify-center w-full h-full">
                  No recent projects
                </div>
              ) }
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProjectSelection;
