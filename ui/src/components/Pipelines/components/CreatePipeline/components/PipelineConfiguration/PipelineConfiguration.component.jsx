import { Form, Input, Select } from "antd";
const { TextArea } = Input;
export const PipelineConfiguration = () => {
  return (
    <div>
      <Form labelCol={{ span: 4 }} wrapperCol={{ span: 14 }} layout="horizontal" style={{ maxWidth: "50vw" }}>
        <Form.Item label="Export File Name">
          <Input addonAfter=".sql" />
        </Form.Item>
        <Form.Item label="Export Mode">
          <Select>
            <Select.Option value="single-file">Single File (All Data Combined)</Select.Option>
            <Select.Option value="multiple-file">Multiple Files (One Per Section)</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </div>
  );
};
