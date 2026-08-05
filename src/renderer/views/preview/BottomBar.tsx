import BuildLogsTab from '../../bottom-tabs/BuildLogsTab';
import BottomBarTabs from '../../components/BottomBarTabs';
import EmulatorLogsTab from '../preview/EmulatorLogsTab';

const BottomBar = () => {
  return (
    <BottomBarTabs
      defaultTab="emulator-logs"
      tabs={[BuildLogsTab, EmulatorLogsTab]}
    />
  );
};

export default BottomBar;
