import BuildLogsTab from '../../bottom-tabs/BuildLogsTab';
import BottomBarTabs from '../../components/BottomBarTabs';

const BottomBar = () => {
  return (
    <BottomBarTabs
      tabs={[BuildLogsTab]}
    />
  );
};

export default BottomBar;
