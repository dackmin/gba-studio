import { type ComponentPropsWithoutRef, useState } from 'react';
import { Card, IconButton, Kbd, Spinner, Text, Tooltip } from '@radix-ui/themes';
import { classNames } from '@junipero/react';

import type { LogMessage } from '../../../types';
import { useApp, useBridgeListener, useEditor, useLocalData } from '../../services/hooks';
import BottomBarIcon from '../../components/BottomBarIcon';
import RightSidebarIcon from '../../components/RightSidebarIcon';

export interface TitleBarProps extends ComponentPropsWithoutRef<'div'> {}

const TitleBar = ({
  className,
  ...rest
}: TitleBarProps) => {
  const { project, dirty, building } = useApp();
  const { hasBottomBar, hasRightSidebar } = useEditor();
  const { collapse, isCollapsed } = useLocalData();
  const [step, setStep] = useState('Initializing build...');

  useBridgeListener('build-step', ({ message }: LogMessage) => {
    setStep(message);
  }, []);

  useBridgeListener('build-aborted', () => {
    setStep('');
  }, []);

  return (
    <div
      { ...rest }
      className={classNames(
        'flex-auto p-2',
        className,
      )}
    >
      <Card
        className={classNames(
          '!rounded-[20px] before:!rounded-[20px] after:!rounded-[20px]',
          'h-12 pointer-events-auto',
        )}
      >
        <div className="flex items-center">
          <div
            className={classNames(
              'flex-none w-[300px] truncate flex justify-start items-center',
              'gap-2',
              {
                'pl-48': isCollapsed('leftSidebar'),
              }
            )}
          >
            { building && (
              <>
                <Spinner size="1" />
                <Text size="1">{ step }</Text>
              </>
            ) }
          </div>
          <div className="flex-auto text-center">
            <Text>{ project?.name }</Text>
            { dirty && (
              <Text size="2" className="text-slate"> (modified)</Text>
            ) }
          </div>
          <div
            className="flex-none w-[300px] flex items-center gap-2 justify-end"
          >
            { hasBottomBar && (
              <IconButton
                className="!m-0 !w-6 !h-6 !p-0"
                size="2"
                variant={!isCollapsed('bottomBar') ? 'solid' : 'ghost'}
                onClick={collapse.bind(null, 'bottomBar')}
              >
                <Tooltip
                  side="bottom"
                  content={(
                    <span className="flex items-center gap-2">
                      <Text>Toggle Bottom Bar</Text>
                      <Kbd>
                        { window.electron.platform === 'darwin' ? '⌘' : 'Ctrl' }
                        →
                      </Kbd>
                    </span>
                  )}
                >
                  <BottomBarIcon
                    width={12}
                    height={12}
                    className={classNames(
                      '[&_path]:fill-onyx dark:[&_path]:fill-seashell',
                      { '[&_path]:!fill-seashell': !isCollapsed('bottomBar') },
                    )}
                  />
                </Tooltip>
              </IconButton>
            ) }
            { hasRightSidebar && (
              <IconButton
                className="!m-0 !w-6 !h-6 !p-0"
                size="2"
                variant={!isCollapsed('rightSidebar') ? 'solid' : 'ghost'}
                onClick={collapse.bind(null, 'rightSidebar')}
              >
                <RightSidebarIcon
                  width={12}
                  height={12}
                  className={classNames(
                    '[&_path]:fill-onyx dark:[&_path]:fill-seashell',
                    { '[&_path]:!fill-seashell': !isCollapsed('rightSidebar') },
                  )}
                />
              </IconButton>
            ) }
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TitleBar;
