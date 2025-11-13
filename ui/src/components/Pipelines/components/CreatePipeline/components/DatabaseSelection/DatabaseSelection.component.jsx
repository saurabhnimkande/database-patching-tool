import { useState, useEffect } from "react";
import { Form, Input, Select, Row, Col } from "antd";
const { TextArea } = Input;
import { axiosInstance } from "../../../../../../utils/axios";
import styles from "./DatabaseSelection.module.css";

export const DatabaseSelection = ({ form, handleFullScreenLoading }) => {
  const type = Form.useWatch('type', form);
  const [databases, setDatabases] = useState([]);
  const [masterSchemas, setMasterSchemas] = useState([]);
  const [compareSchemas, setCompareSchemas] = useState([]);

  useEffect(() => {
    fetchDatabases();
  }, []);

  const fetchDatabases = async () => {
    handleFullScreenLoading(true, "Loading databases...");
    try {
      const response = await axiosInstance.get("/db-config/database-list");
      if (response.data.status === "Success") {
        setDatabases(response.data.result);
      }
    } catch (error) {
      console.error("Error fetching databases:", error);
    } finally {
      handleFullScreenLoading(false, "");
    }
  };

  const fetchSchemas = async (databaseName, isMaster = true) => {
    if (!databaseName) return;

    const setSchemas = isMaster ? setMasterSchemas : setCompareSchemas;
    const message = isMaster ? "Loading master schemas..." : "Loading compare schemas...";

    handleFullScreenLoading(true, message);
    try {
      const response = await axiosInstance.get(`/db-config/database-schemas/${databaseName}`);
      if (response.data.status === "Success") {
        setSchemas(response.data.result);
      }
    } catch (error) {
      console.error("Error fetching schemas:", error);
      setSchemas([]);
    } finally {
      handleFullScreenLoading(false, "");
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

  return (
    <div className={styles.databaseSelectionContainer} style={{ width: "100%" }}>
      <Row gutter={12}>
        {/* Row 1 */}
        <Col xs={24} md={12}>
          <Form.Item label="Select master database" labelCol={{ flex: "180px" }} wrapperCol={{ flex: "auto" }} name="masterDatabase" rules={[{ required: true, message: 'Please select a master database' }]}>
            <Select
              style={{ width: "100%" }}
              onChange={handleMasterDatabaseChange}
              placeholder="Select a database"
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
          <Form.Item label="Select Schema" labelCol={{ flex: "150px" }} wrapperCol={{ flex: "auto" }} name="masterSchema" rules={[{ required: true, message: 'Please select a master schema' }]}>
            <Select
              style={{ width: "60%" }}
              placeholder="Select a schema"
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
              <Form.Item label="Select Compare database" labelCol={{ flex: "180px" }} wrapperCol={{ flex: "auto" }} name="compareDatabase" rules={[{ required: true, message: 'Please select a compare database' }]}>
                <Select
                  style={{ width: "100%" }}
                  onChange={handleCompareDatabaseChange}
                  placeholder="Select a database"
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
              <Form.Item label="Select Schema" labelCol={{ flex: "150px" }} wrapperCol={{ flex: "auto" }} name="compareSchema" rules={[{ required: true, message: 'Please select a compare schema' }]}>
                <Select
                  style={{ width: "60%" }}
                  placeholder="Select a schema"
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
