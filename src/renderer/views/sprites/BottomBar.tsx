import BottomBarTabs from '../../components/BottomBarTabs';
import BuildLogsTab from '../../bottom-tabs/BuildLogsTab';
import AnimationsTab from './AnimationsTab';

const BottomBar = () => {
  return (
    <BottomBarTabs
      defaultTab="animations"
      tabs={[
        BuildLogsTab,
        AnimationsTab,
      ]}
    />
  );
};

export default BottomBar;
