import { type MouseEvent, useCallback, useEffect, useReducer } from 'react';
import { Button, Card, Dialog, Heading, Text } from '@radix-ui/themes';
import { classNames, mockState } from '@junipero/react';

import type { RecentProject } from '../../../types';
import pkg from '../../../../package.json' with { type: 'json' };
import icon from '../../../../public/icon.svg?url';
import NewProjectForm from './NewProjectForm';
import Close from './Close';

export interface ProjectSelectionState {
  recentProjects: RecentProject[];
  selectedProject?: RecentProject;
}

const ProjectSelection = () => {
  const [state, dispatch] = useReducer(mockState<ProjectSelectionState>, {
    recentProjects: [],
    selectedProject: undefined,
  });

  const onOpenExisting = async () => {
    await window.electron.browseProjects();
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
      window.electron.loadRecentProject(project.path);

      return;
    }

    dispatch({ selectedProject: project });
  };

  const onClearRecentProjects = async () => {
    await window.electron.clearRecentProjects();
    dispatch({ recentProjects: [], selectedProject: undefined });
  };

  return (
    <div
      className={classNames(
        'flex items-stretch relative w-screen h-screen',
        'app-drag',
      )}
    >
      <Close onClick={onClose} />
      <div
        className={classNames(
          'flex-auto flex flex-col items-center p-8 gap-4'
        )}
      >
        <div
          className={classNames(
            'w-[100px] aspect-square bg-alabaster dark:bg-nevada rounded-2xl',
            'mt-12 shadow-2xl shadow-[#7c28bb]/50 relative z-1'
          )}
          style={{
            backgroundImage: `url(${icon})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="text-center relative z-10">
          <Heading as="h1">GBA Studio</Heading>
          <Text>v{ pkg.version }</Text>
        </div>
        <div className="mt-12 flex flex-col items-stretch gap-2">
          <Dialog.Root>
            <Dialog.Trigger>
              <Button
                variant="solid"
                className="!app-no-drag"
              >
                <Text>Create a new project</Text>
              </Button>
            </Dialog.Trigger>
            <Dialog.Content className="!app-no-drag">
              <Dialog.Close>
                <Close />
              </Dialog.Close>
              <Dialog.Title align="center" className="pb-4">
                Create a new project
              </Dialog.Title>
              <NewProjectForm />
            </Dialog.Content>
          </Dialog.Root>
          <div>
            <Button
              variant="soft"
              onClick={onOpenExisting}
              className="!app-no-drag"
            >
              <Text>Open an existing project</Text>
            </Button>
          </div>
          <div className="text-center mt-2">
            <Button
              variant="ghost"
              onClick={onClearRecentProjects}
              className="!app-no-drag"
              size="1"
            >
              <Text>Clear recent projects</Text>
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-none w-[300px] p-2">
        <Card
          className={classNames(
            'h-full app-no-drag !rounded-[20px] before:!rounded-[20px]',
            'after:!rounded-[20px] !p-0',
          )}
        >
          <div className="flex flex-col gap-2 h-full overflow-y-scroll p-2">
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
