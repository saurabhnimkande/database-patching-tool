import { Form, Input, Select } from "antd";
const { TextArea } = Input;
export const BasicSetup = () => {
  return (
    <div style={{ maxWidth: "50vw" }}>
      <Form.Item label="Name" name="name" labelCol={{ span: 3 }} wrapperCol={{ span: 14 }} rules={[{ required: true, message: 'Please enter the name!' }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Type" name="type" labelCol={{ span: 3 }} wrapperCol={{ span: 14 }} rules={[{ required: true, message: 'Please select a type!' }]}>
        <Select>
          <Select.Option value="generate">Generate</Select.Option>
          <Select.Option value="compare">Compare</Select.Option>
          <Select.Option value="extract-seed">Extract Seeds</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item label="Sub-Type" name="subType" labelCol={{ span: 3 }} wrapperCol={{ span: 14 }} rules={[{ required: true, message: 'Please select a sub-type!' }]}>
        <Select>
          <Select.Option value="tables">Tables</Select.Option>
          <Select.Option value="views">Views</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item label="Description" name="description" labelCol={{ span: 3 }} wrapperCol={{ span: 14 }}>
        <TextArea rows={4} />
      </Form.Item>
    </div>
  );
};
