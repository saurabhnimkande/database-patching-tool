import { Menu, Input } from "antd";
import {
  DeploymentUnitOutlined, // Pipeline
  DatabaseOutlined, // Database Config
  SettingOutlined, // Settings
  MenuFoldOutlined,
  SearchOutlined,
  ReadOutlined
} from "@ant-design/icons";
import styles from "./Sidebar.module.css";

export const Sidebar = () => {
  const items = [
    {
      key: "grp",
      label: "NAVIGATION",
      type: "group",
      children: [
        { key: "pipelines", label: "Pipelines", icon: <DeploymentUnitOutlined /> },
        { key: "db-config", label: "Database Config", icon: <DatabaseOutlined /> },
        { key: "settings", label: "Settings", icon: <SettingOutlined /> },
      ],
    },
  ];

  const sidebarOnClick = (e) => {
    console.log("click", e.key);
    // route or state updates go here based on e.key
  };

  return (
    <div className={styles.sidebarContainer}>
      <div className={styles.logoContainer}>
        <div>
          <img src="/dbt.png" alt="App logo" className={styles.logoImage} />
        </div>
        <div className={styles.collapseIconContainer}>
          <MenuFoldOutlined />
        </div>
      </div>
      <Input placeholder="Search" prefix={<SearchOutlined />} className={styles.searchBox} allowClear onPressEnter={(e) => console.log(e.target.value)} />
      <Menu onClick={sidebarOnClick} defaultSelectedKeys={["pipelines"]} mode="inline" items={items} style={{ borderInlineEnd: 0 }} />
      <div className={styles.moreDetails}>
        <div className={styles.moreDetailsIcon}><ReadOutlined /></div>
        <div>Getting Started with the Database Patching Tool</div>
        <div className={styles.learnMore}>Learn more</div>
      </div>
      <div className={styles.sidebarFooterText}>Made with ❤️ by Saurabh Nimkande</div>
    </div>
  );
};
