import { Form, Input, Select } from "antd";
export const PipelineConfiguration = () => {
  return (
    <div style={{ maxWidth: "50vw" }}>
      <Form.Item label="Export File Name" name="exportFileName" labelCol={{ span: 4 }} wrapperCol={{ span: 14 }}>
        <Input addonAfter=".sql" />
      </Form.Item>
      <Form.Item label="Export Mode" name="exportMode" labelCol={{ span: 4 }} wrapperCol={{ span: 14 }}>
        <Select>
          <Select.Option value="single-file">Single File (All Data Combined)</Select.Option>
          <Select.Option value="multiple-file">Multiple Files (One Per Section)</Select.Option>
        </Select>
      </Form.Item>
    </div>
  );
};
