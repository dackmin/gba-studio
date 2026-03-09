import BuildLogsTab from '../../bottom-tabs/BuildLogsTab';
import BottomBarTabs from '../../components/BottomBarTabs';

const BottomSidebar = () => {
  return (
    <BottomBarTabs
      tabs={[BuildLogsTab]}
    />
  );
};

export default BottomSidebar;
