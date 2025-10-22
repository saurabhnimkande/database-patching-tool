import { Form, Input, Select, Row, Col } from "antd";
const { TextArea } = Input;
import styles from "./DatabaseSelection.module.css";

export const DatabaseSelection = () => {
  return (
    <div className={styles.databaseSelectionContainer}>
      <Form layout="horizontal" style={{ width: "100%" }}>
        <Row gutter={12}>
          {/* Row 1 */}
          <Col xs={24} md={12}>
            <Form.Item label="Select master database" labelCol={{ flex: "180px" }} wrapperCol={{ flex: "auto" }}>
              <Select style={{ width: "100%" }}>
                <Select.Option value="generate">Generate</Select.Option>
                <Select.Option value="compare">Compare</Select.Option>
                <Select.Option value="extract-seed">Extract Seeds</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Select Schema" labelCol={{ flex: "150px" }} wrapperCol={{ flex: "auto" }}>
              <Select style={{ width: "60%" }}>
                <Select.Option value="generate">Generate</Select.Option>
                <Select.Option value="compare">Compare</Select.Option>
                <Select.Option value="extract-seed">Extract Seeds</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          {/* Row 2 */}
          <Col xs={24} md={12}>
            <Form.Item label="Select Compare database" labelCol={{ flex: "180px" }} wrapperCol={{ flex: "auto" }}>
              <Select style={{ width: "100%" }}>
                <Select.Option value="generate">Generate</Select.Option>
                <Select.Option value="compare">Compare</Select.Option>
                <Select.Option value="extract-seed">Extract Seeds</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Select Schema" labelCol={{ flex: "150px" }} wrapperCol={{ flex: "auto" }}>
              <Select style={{ width: "60%" }}>
                <Select.Option value="generate">Generate</Select.Option>
                <Select.Option value="compare">Compare</Select.Option>
                <Select.Option value="extract-seed">Extract Seeds</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};
