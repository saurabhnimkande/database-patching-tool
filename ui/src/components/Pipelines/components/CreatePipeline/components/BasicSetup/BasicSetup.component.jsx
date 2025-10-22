import { Form, Input, Select } from "antd";
const { TextArea } = Input;
export const BasicSetup = () => {
  return (
    <div>
      <Form labelCol={{ span: 3 }} wrapperCol={{ span: 14 }} layout="horizontal" style={{ maxWidth: "50vw" }}>
        <Form.Item label="Name">
          <Input />
        </Form.Item>
        <Form.Item label="Type">
          <Select>
            <Select.Option value="generate">Generate</Select.Option>
            <Select.Option value="compare">Compare</Select.Option>
            <Select.Option value="extract-seed">Extract Seeds</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="Sub-Type">
          <Select>
            <Select.Option value="tables">Tables</Select.Option>
            <Select.Option value="views">Views</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="Description">
          <TextArea rows={4} />
        </Form.Item>
      </Form>
    </div>
  );
};
