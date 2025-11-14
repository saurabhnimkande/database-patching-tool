import { Button, message, Steps, theme, Form } from "antd";
import { SmileOutlined, SolutionOutlined, UserOutlined } from "@ant-design/icons";
import styles from "./CreatePipeline.module.css";
import { useState, useEffect } from "react";
import { BasicSetup } from "./components/BasicSetup/BasicSetup.component";
import { DatabaseSelection } from "./components/DatabaseSelection/DatabaseSelection.component";
import { PipelineConfiguration } from "./components/PipelineConfiguration/PipelineConfiguration.component";
import DatasetSelector from "./components/DatasetSelector/DatasetSelector.component";
import { axiosInstance } from "../../../../utils/axios";
import { pipelineTypes } from "../../../../config/pipelineTypes.js";

export const CreatePipeline = ({ handleSelectedComponent, pipelineData, showMessage, handleFullScreenLoading }) => {
  const [form] = Form.useForm();
  const [allDataset, setAllDataset] = useState([]);
  const [picked, setPicked] = useState([]);
  const [saving, setSaving] = useState(false);


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
  const masterDatabase = Form.useWatch('masterDatabase', form);
  const masterSchema = Form.useWatch('masterSchema', form);
  const subType = Form.useWatch('subType', form);
  const next = async () => {
    if (current === 0) {
      try {
        const type = form.getFieldValue('type');
        const fieldsToValidate = ['name', 'type'];
        if (type && pipelineTypes[type]?.subtypes.length > 0) {
          fieldsToValidate.push('subType');
        }
        await form.validateFields(fieldsToValidate);
      } catch {
        showMessage('error', 'Please fill in all required fields in Basic Setup');
        return;
      }
    } else if (current === 1) {
      try {
        const type = form.getFieldValue('type');
        const fieldsToValidate = ['masterDatabase', 'masterSchema'];
        if (type === 'compare') {
          fieldsToValidate.push('compareDatabase', 'compareSchema');
        }
        await form.validateFields(fieldsToValidate);
      } catch {
        showMessage('error', 'Please fill in all required fields in Database Selection');
        return;
      }
    }
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

  // Initialize form data when editing an existing pipeline
  useEffect(() => {
    if (pipelineData) {
      form.setFieldsValue({
        name: pipelineData.name || '',
        type: pipelineData.type || '',
        subType: pipelineData.subType || '',
        description: pipelineData.description || '',
        masterDatabase: pipelineData.masterDatabase || '',
        masterSchema: pipelineData.masterSchema || '',
        compareDatabase: pipelineData.compareDatabase || '',
        compareSchema: pipelineData.compareSchema || '',
        exportFileName: pipelineData.exportFileName || '',
        exportMode: pipelineData.exportMode || '',
      });
      // Don't set picked here - it will be set after tables are loaded
    } else {
      // Reset to empty state when creating new pipeline
      form.resetFields();
      setPicked([]);
    }
  }, [pipelineData, form]);

  // Fetch tables/views when master database and schema are selected
  useEffect(() => {
    const fetchData = async () => {
      if (masterDatabase && masterSchema && subType) {
        const isViews = subType === 'views';
        const loadingText = `Loading ${isViews ? 'views' : 'tables'}...`;
        handleFullScreenLoading(true, loadingText);
        try {
          const endpoint = isViews
            ? `/db-config/database-views/${masterDatabase}/${masterSchema}`
            : `/db-config/database-tables/${masterDatabase}/${masterSchema}`;
          const response = await axiosInstance.get(endpoint);
          if (response.data.status === 'Success') {
            setAllDataset(response.data.result);
            // For editing: set picked tables to the saved selection, filtered to available tables
            // For creating: keep current picked tables, filtered to available tables
            if (pipelineData) {
              setPicked((pipelineData.selectedDataset || []).filter(table => response.data.result.includes(table)));
            } else {
              setPicked(prev => prev.filter(table => response.data.result.includes(table)));
            }
          } else {
            const itemType = isViews ? 'views' : 'tables';
            showMessage('error', `Failed to fetch ${itemType}`);
            setAllDataset([]);
            setPicked([]);
          }
        } catch (error) {
          console.error(`Error fetching ${subType === 'views' ? 'views' : 'tables'}:`, error);
          const itemType = subType === 'views' ? 'views' : 'tables';
          message.error(`Failed to fetch ${itemType} from database`);
          setAllDataset([]);
          setPicked([]);
        } finally {
          handleFullScreenLoading(false, "");
        }
      } else {
        setAllDataset([]);
        setPicked([]);
      }
    };

    fetchData();
  }, [masterDatabase, masterSchema, subType, pipelineData, handleFullScreenLoading, showMessage]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const pipelinePayload = {
        name: values.name,
        type: values.type,
        subType: values.subType,
        description: values.description,
        masterDatabase: values.masterDatabase,
        masterSchema: values.masterSchema,
        compareDatabase: values.compareDatabase,
        compareSchema: values.compareSchema,
        selectedDataset: picked,
        exportFileName: values.exportFileName,
        exportMode: values.exportMode,
      };

      let response;
      if (pipelineData) {
        // Update existing pipeline
        response = await axiosInstance.put(`/pipelines/${pipelineData.id}`, pipelinePayload);
      } else {
        // Create new pipeline
        response = await axiosInstance.post('/pipelines/create', pipelinePayload);
      }

      if (response.data.status === 'Success') {
        showMessage('success', pipelineData ? 'Pipeline updated successfully!' : 'Pipeline created successfully!');
        handleSelectedComponent('pipelines');
      } else {
        showMessage('error', response.data.message || `Failed to ${pipelineData ? 'update' : 'create'} pipeline`);
      }
    } catch (error) {
      console.error('Error saving pipeline:', error);
      showMessage('error', 'Failed to save pipeline');
    } finally {
      setSaving(false);
    }
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
        <Form form={form} layout="horizontal" style={{ width: "100%" }}>
          <div style={contentStyle}>
            <div style={{ display: current === 0 ? 'block' : 'none' }}>
              <BasicSetup />
            </div>
            <div style={{ display: current === 1 ? 'block' : 'none' }}>
              <DatabaseSelection form={form} handleFullScreenLoading={handleFullScreenLoading} />
            </div>
            <div style={{ display: current === 2 ? 'block' : 'none' }}>
              <DatasetSelector items={allDataset} selected={picked} onChange={setPicked} searchable title="Select Dataset" />
            </div>
            <div style={{ display: current === 3 ? 'block' : 'none' }}>
              <PipelineConfiguration />
            </div>
          </div>
        </Form>
        <div style={{ marginTop: 24 }}>
          {current < steps.length - 1 && (
            <Button type="primary" onClick={() => next()}>
              Next
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button type="primary" onClick={handleSave} loading={saving} disabled={saving}>
              {saving ? 'Saving...' : (pipelineData ? 'Update' : 'Save')}
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
