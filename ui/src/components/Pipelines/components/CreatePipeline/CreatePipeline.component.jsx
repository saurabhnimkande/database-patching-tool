import { Button, message, Steps, theme, Spin } from "antd";
import { LoadingOutlined, SmileOutlined, SolutionOutlined, UserOutlined } from "@ant-design/icons";
import styles from "./CreatePipeline.module.css";
import { useState, useEffect } from "react";
import { BasicSetup } from "./components/BasicSetup/BasicSetup.component";
import { DatabaseSelection } from "./components/DatabaseSelection/DatabaseSelection.component";
import { PipelineConfiguration } from "./components/PipelineConfiguration/PipelineConfiguration.component";
import TableSelector from "./components/TableSelector/TableSelector.component";
import { axiosInstance } from "../../../../utils/axios";

export const CreatePipeline = ({ handleSelectedComponent }) => {
  const [allTables, setAllTables] = useState([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [picked, setPicked] = useState([]);
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

  // Fetch tables when master database and schema are selected
  useEffect(() => {
    const fetchTables = async () => {
      if (databaseSelectionData.masterDatabase && databaseSelectionData.masterSchema) {
        setTablesLoading(true);
        try {
          const response = await axiosInstance.get(`/db-config/database-tables/${databaseSelectionData.masterDatabase}/${databaseSelectionData.masterSchema}`);
          if (response.data.status === 'Success') {
            setAllTables(response.data.result);
            // Reset picked tables if they don't exist in the new table list
            setPicked(prev => prev.filter(table => response.data.result.includes(table)));
          } else {
            message.error('Failed to fetch tables');
            setAllTables([]);
            setPicked([]);
          }
        } catch (error) {
          console.error('Error fetching tables:', error);
          message.error('Failed to fetch tables from database');
          setAllTables([]);
          setPicked([]);
        } finally {
          setTablesLoading(false);
        }
      } else {
        setAllTables([]);
        setPicked([]);
      }
    };

    fetchTables();
  }, [databaseSelectionData.masterDatabase, databaseSelectionData.masterSchema]);

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
            {tablesLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <Spin size="large" />
              </div>
            ) : (
              <TableSelector tables={allTables} selected={picked} onChange={setPicked} searchable title="Select Dataset" />
            )}
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
