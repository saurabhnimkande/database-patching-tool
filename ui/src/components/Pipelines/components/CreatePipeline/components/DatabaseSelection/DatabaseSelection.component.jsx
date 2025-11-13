import { useState, useEffect } from "react";
import { Form, Input, Select, Row, Col, Spin } from "antd";
const { TextArea } = Input;
import { axiosInstance } from "../../../../../../utils/axios";
import styles from "./DatabaseSelection.module.css";

export const DatabaseSelection = ({ form }) => {
  const type = Form.useWatch('type', form);
  const [databases, setDatabases] = useState([]);
  const [masterSchemas, setMasterSchemas] = useState([]);
  const [compareSchemas, setCompareSchemas] = useState([]);
  const [loadingDatabases, setLoadingDatabases] = useState(false);
  const [loadingMasterSchemas, setLoadingMasterSchemas] = useState(false);
  const [loadingCompareSchemas, setLoadingCompareSchemas] = useState(false);

  useEffect(() => {
    fetchDatabases();
  }, []);

  const fetchDatabases = async () => {
    setLoadingDatabases(true);
    try {
      const response = await axiosInstance.get("/db-config/database-list");
      if (response.data.status === "Success") {
        setDatabases(response.data.result);
      }
    } catch (error) {
      console.error("Error fetching databases:", error);
    } finally {
      setLoadingDatabases(false);
    }
  };

  const fetchSchemas = async (databaseName, isMaster = true) => {
    if (!databaseName) return;

    const setLoading = isMaster ? setLoadingMasterSchemas : setLoadingCompareSchemas;
    const setSchemas = isMaster ? setMasterSchemas : setCompareSchemas;

    setLoading(true);
    try {
      const response = await axiosInstance.get(`/db-config/database-schemas/${databaseName}`);
      if (response.data.status === "Success") {
        setSchemas(response.data.result);
      }
    } catch (error) {
      console.error("Error fetching schemas:", error);
      setSchemas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMasterDatabaseChange = (value) => {
    form.setFieldsValue({ masterDatabase: value });
    fetchSchemas(value, true);
  };

  const handleCompareDatabaseChange = (value) => {
    form.setFieldsValue({ compareDatabase: value });
    fetchSchemas(value, false);
  };

  const handleMasterSchemaChange = (value) => {
    form.setFieldsValue({ masterSchema: value });
  };

  const handleCompareSchemaChange = (value) => {
    form.setFieldsValue({ compareSchema: value });
  };

  const isLoadingAnySchema = loadingMasterSchemas || loadingCompareSchemas;

  return (
    <div className={styles.databaseSelectionContainer} style={{ width: "100%" }}>
      {isLoadingAnySchema && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <Spin size="large" />
        </div>
      )}
      <Row gutter={12}>
        {/* Row 1 */}
        <Col xs={24} md={12}>
          <Form.Item label="Select master database" labelCol={{ flex: "180px" }} wrapperCol={{ flex: "auto" }} name="masterDatabase">
            <Select
              style={{ width: "100%" }}
              loading={loadingDatabases}
              onChange={handleMasterDatabaseChange}
              placeholder="Select a database"
              disabled={isLoadingAnySchema}
            >
              {databases.map((db) => (
                <Select.Option key={db.name} value={db.name}>
                  {db.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item label="Select Schema" labelCol={{ flex: "150px" }} wrapperCol={{ flex: "auto" }} name="masterSchema">
            <Select
              style={{ width: "60%" }}
              loading={loadingMasterSchemas}
              placeholder="Select a schema"
              disabled={isLoadingAnySchema}
              onChange={handleMasterSchemaChange}
            >
              {masterSchemas.map((schema) => (
                <Select.Option key={schema} value={schema}>
                  {schema}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        {/* Row 2 - Only show for compare type */}
        {type === 'compare' && (
          <>
            <Col xs={24} md={12}>
              <Form.Item label="Select Compare database" labelCol={{ flex: "180px" }} wrapperCol={{ flex: "auto" }} name="compareDatabase">
                <Select
                  style={{ width: "100%" }}
                  loading={loadingDatabases}
                  onChange={handleCompareDatabaseChange}
                  placeholder="Select a database"
                  disabled={isLoadingAnySchema}
                >
                  {databases.map((db) => (
                    <Select.Option key={db.name} value={db.name}>
                      {db.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Select Schema" labelCol={{ flex: "150px" }} wrapperCol={{ flex: "auto" }} name="compareSchema">
                <Select
                  style={{ width: "60%" }}
                  loading={loadingCompareSchemas}
                  placeholder="Select a schema"
                  disabled={isLoadingAnySchema}
                  onChange={handleCompareSchemaChange}
                >
                  {compareSchemas.map((schema) => (
                    <Select.Option key={schema} value={schema}>
                      {schema}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </>
        )}
      </Row>
    </div>
  );
};
