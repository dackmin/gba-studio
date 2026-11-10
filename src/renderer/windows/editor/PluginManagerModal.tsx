import { type Ref, useCallback, useImperativeHandle, useState } from 'react';
import {
  AlertDialog,
  Badge,
  Button,
  Callout,
  Card,
  Dialog,
  IconButton,
  ScrollArea,
  Switch,
  Text,
} from '@radix-ui/themes';
import {
  CubeIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
} from '@radix-ui/react-icons';

import type { GamePlugin, ProjectPlugin } from '../../../types';
import { useApp } from '../../services/hooks';
import DialogClose from '../../components/DialogClose';

export interface PluginManagerModalRef {
  open: () => void;
  close: () => void;
}

export interface PluginManagerModalProps {
  ref: Ref<PluginManagerModalRef>;
}

const PluginManagerModal = ({
  ref,
}: PluginManagerModalProps) => {
  const { plugins = [], project, projectPath, onProjectChange } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [toRemove, setToRemove] = useState<GamePlugin>();

  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  }));

  const onOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);

    if (!open) {
      setError(undefined);
    }
  }, []);

  const setProjectPlugins = useCallback((entries: ProjectPlugin[]) => {
    if (project) {
      onProjectChange?.({ ...project, plugins: entries });
    }
  }, [project, onProjectChange]);

  const onInstall = useCallback(async () => {
    const result = await window.electron.pickPlugin(projectPath);

    if (!result) {
      return;
    }

    setError(result.error);

    if (
      result.path &&
      !project?.plugins?.some(p => p.path === result.path)
    ) {
      setProjectPlugins([...project?.plugins ?? [], { path: result.path }]);
    }
  }, [projectPath, project?.plugins, setProjectPlugins]);

  const onToggle = useCallback((plugin: GamePlugin, enabled: boolean) => {
    setError(undefined);
    setProjectPlugins((project?.plugins ?? []).map(p => (
      p.path === plugin._path ? { ...p, enabled } : p
    )));
  }, [project?.plugins, setProjectPlugins]);

  const onConfirmRemove = useCallback(() => {
    if (toRemove) {
      setProjectPlugins(
        (project?.plugins ?? []).filter(p => p.path !== toRemove._path));
    }

    setToRemove(undefined);
  }, [project?.plugins, toRemove, setProjectPlugins]);

  const onOpenFolder = useCallback((plugin: GamePlugin) => {
    window.electron.openPluginFolder(plugin._dir);
  }, []);

  return (
    <>
      <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
        <Dialog.Content maxWidth="640px">
          <Dialog.Close>
            <DialogClose />
          </Dialog.Close>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center pb-4">
            <div />
            <Dialog.Title align="center" style={{ margin: 0 }}>
              Plugin Manager
            </Dialog.Title>
            <div className="flex justify-end">
              <Button size="1" onClick={onInstall}>
                <PlusIcon />
                Install plugin...
              </Button>
            </div>
          </div>

          { error && (
            <Callout.Root color="red" size="1" className="mb-4">
              <Callout.Icon><ExclamationTriangleIcon /></Callout.Icon>
              <Callout.Text>{ error }</Callout.Text>
            </Callout.Root>
          ) }

          <ScrollArea scrollbars="vertical" className="!max-h-[400px]">
            <div className="flex flex-col gap-2">
              { plugins.length === 0 ? (
                <div className="p-8 text-center text-slate">
                  <Text>No plugins installed</Text>
                </div>
              ) : plugins.map(plugin => (
                <Card key={plugin._dir}>
                  <div className="flex items-start gap-3">
                    <CubeIcon className="flex-none mt-1 [&_path]:fill-(--accent-9)" />
                    <div className="flex-auto min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Text
                          weight="bold"
                          className="cursor-pointer hover:underline"
                          title={plugin._dir}
                          onClick={onOpenFolder.bind(null, plugin)}
                        >
                          { plugin.name }
                        </Text>
                        { plugin.version && (
                          <Badge variant="soft">v{ plugin.version }</Badge>
                        ) }
                        { plugin.author && (
                          <Text size="1" className="text-slate">
                            by { plugin.author }
                          </Text>
                        ) }
                      </div>
                      { plugin.description && (
                        <Text as="p" size="2" className="text-slate">
                          { plugin.description }
                        </Text>
                      ) }
                      { plugin._error && (
                        <Callout.Root color="red" size="1" className="mt-2">
                          <Callout.Icon><ExclamationTriangleIcon /></Callout.Icon>
                          <Callout.Text>{ plugin._error }</Callout.Text>
                        </Callout.Root>
                      ) }
                    </div>
                    <div className="flex flex-none items-center gap-3">
                      { !plugin._error && (
                        <Switch
                          checked={plugin.enabled}
                          onCheckedChange={onToggle.bind(null, plugin)}
                        />
                      ) }
                      <IconButton
                        variant="ghost"
                        color="red"
                        onClick={setToRemove.bind(null, plugin)}
                      >
                        <TrashIcon />
                      </IconButton>
                    </div>
                  </div>
                </Card>
              )) }
            </div>
          </ScrollArea>
        </Dialog.Content>
      </Dialog.Root>

      <AlertDialog.Root
        open={!!toRemove}
        onOpenChange={open => !open && setToRemove(undefined)}
      >
        <AlertDialog.Content maxWidth="420px">
          <AlertDialog.Title>Remove plugin</AlertDialog.Title>
          <AlertDialog.Description size="2">
            &ldquo;{ toRemove?.name }&rdquo; will be removed from this project. Its folder
            is left untouched, and events using it will stay in your scenes but be ignored when
            building.
          </AlertDialog.Description>
          <div className="flex justify-end gap-3 mt-4">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">Cancel</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button color="red" onClick={onConfirmRemove}>Remove</Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </>
  );
};

export default PluginManagerModal;
