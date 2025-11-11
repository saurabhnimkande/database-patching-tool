import { Button, message, Steps, theme } from "antd";
import { LoadingOutlined, SmileOutlined, SolutionOutlined, UserOutlined } from "@ant-design/icons";
import styles from "./CreatePipeline.module.css";
import { useState } from "react";
import { BasicSetup } from "./components/BasicSetup/BasicSetup.component";
import { DatabaseSelection } from "./components/DatabaseSelection/DatabaseSelection.component";
import { PipelineConfiguration } from "./components/PipelineConfiguration/PipelineConfiguration.component";
import TableSelector from "./components/TableSelector/TableSelector.component";

export const CreatePipeline = ({ handleSelectedComponent }) => {
  const allTables = [
    "users",
    "orders",
    "order_items",
    "products",
    "categories",
    "invoices",
    "payments",
    "shipment_events",
    "audit_log",
    "sessions",
    "roles",
    "permissions",
    "Flame Gale",
    "Rapid Flare",
    "Lunar Fox",
    "Blue Tiger",
    "Emerald Seeker",
    "Savage Dragon",
    "Mystic Whisper",
    "Golden Knight",
    "Velvet Flare",
    "Rapid Shadow",
    "Iron Vortex",
    "Echo Hawk",
    "Ivory Dancer",
    "Whisper Storm",
    "Dawn Hunter",
    "Obsidian Wanderer",
    "Cobalt Whisper",
    "Whisper Shade",
    "Crystal Scribe",
    "Velvet Hunter",
    "Frost Rider",
    "Breezy Scribe",
    "Lunar Blade",
    "Frost Phoenix",
    "Dark Wolf",
    "Scarlet Whisper",
    "Dusk Shade",
    "Shadow Whisper",
    "Dark Whisper",
    "Golden Scribe",
    "Lunar Knight",
    "Rapid Wanderer",
    "Aurora Rider",
    "Iron Wolf",
    "Whisper Dancer",
    "Shadow Scribe",
    "Frost Wanderer",
    "Golden Whisper",
    "Storm Seeker",
    "Crimson Whisper",
    "Velvet Knight",
    "Savage Seeker",
    "Ivory Shade",
    "Velvet Scribe",
    "Dark Seeker",
    "Scarlet Rider",
    "Whisper Seeker",
    "Aurora Wanderer",
    "Obsidian Phoenix",
    "Crimson Rider",
    "Shadow Shade",
    "Echo Wanderer",
    "Savage Wanderer",
    "Breezy Knight",
    "Blue Hunter",
    "Rapid Rider",
    "Velvet Wanderer",
    "Crimson Dragon",
    "Whisper Rider",
    "Lunar Scribe",
    "Mystic Hunter",
    "Aurora Whisper",
    "Silver Shadow",
    "Dusk Hunter",
    "Golden Wanderer",
    "Scarlet Hunter",
    "Iron Wanderer",
    "Obsidian Dragon",
    "Aurora Hunter",
    "Scarlet Phoenix",
    "Echo Dragon",
    "Blue Fox",
    "Iron Knight",
    "Storm Whisper",
    "Storm Wanderer",
    "Crimson Seeker",
    "Golden Phoenix",
    "Silver Rider",
    "Obsidian Rider",
    "Ivory Knight",
    "Lunar Seeker",
    "Silver Knight",
    "Iron Shadow",
    "Aurora Seeker",
    "Storm Knight",
    "Whisper Phoenix",
    "Dawn Seeker",
    "Mystic Fox",
    "Dark Knight",
    "Crimson Knight",
    "Frost Hunter",
    "Silver Seeker",
    "Blue Wanderer",
    "Lunar Wanderer",
    "Dusk Wanderer",
    "Aurora Shadow",
    "Rapid Wolf",
  ];
  const [picked, setPicked] = useState(["users", "orders"]);
  const [basicSetupData, setBasicSetupData] = useState({ name: '', type: '', subType: '', description: '' });
  const [databaseSelectionData, setDatabaseSelectionData] = useState({ masterDatabase: '', masterSchema: '', compareDatabase: '', compareSchema: '' });
  const [pipelineConfigurationData, setPipelineConfigurationData] = useState({ exportFileName: '', exportMode: '' });
  const steps = [
    {
      title: "Basic",
      icon: <UserOutlined />,
    },
    {
      title: "Database selection",
      icon: <SolutionOutlined />,
    },
    {
      title: "Select Dataset",
      icon: <SolutionOutlined />,
    },
    {
      title: "Configurations",
      icon: <SmileOutlined />,
    },
  ];

  const { token } = theme.useToken();
  const [current, setCurrent] = useState(0);
  const next = () => {
    setCurrent(current + 1);
  };
  const prev = () => {
    setCurrent(current - 1);
  };
  const items = steps.map((item) => ({ key: item.title, title: item.title, icon: item.icon }));
  const contentStyle = {
    color: token.colorTextTertiary,
    borderRadius: token.borderRadiusLG,
    border: `1px dashed ${token.colorBorder}`,
    height: "calc(100vh - 20rem)",
    marginTop: "1.5rem",
    padding: "1.5rem",
    textAlign: "left",
  };
  return (
    <div className={styles.createPipelineContainer}>
      <div className={styles.backButton}>
        <Button type="primary" onClick={() => handleSelectedComponent("pipelines")}>
          Back
        </Button>
      </div>
      <div>
        <Steps current={current} items={items} size="small" />
        <div style={contentStyle}>
          <div style={{ display: current === 0 ? 'block' : 'none' }}>
            <BasicSetup initialValues={basicSetupData} onValuesChange={setBasicSetupData} />
          </div>
          <div style={{ display: current === 1 ? 'block' : 'none' }}>
            <DatabaseSelection initialValues={databaseSelectionData} onValuesChange={setDatabaseSelectionData} />
          </div>
          <div style={{ display: current === 2 ? 'block' : 'none' }}>
            <TableSelector tables={allTables} selected={picked} onChange={setPicked} searchable title="Select Dataset" />
          </div>
          <div style={{ display: current === 3 ? 'block' : 'none' }}>
            <PipelineConfiguration initialValues={pipelineConfigurationData} onValuesChange={setPipelineConfigurationData} />
          </div>
        </div>
        <div style={{ marginTop: 24 }}>
          {current < steps.length - 1 && (
            <Button type="primary" onClick={() => next()}>
              Next
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button type="primary" onClick={() => message.success("Processing complete!")}>
              Save
            </Button>
          )}
          {current > 0 && (
            <Button style={{ margin: "0 8px" }} type="default" onClick={() => prev()}>
              Previous
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
