import { Form, Input, Select } from "antd";
import { useEffect } from "react";
const { TextArea } = Input;
export const BasicSetup = ({ initialValues, onValuesChange }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const handleValuesChange = (changedValues, allValues) => {
    onValuesChange(prev => ({ ...prev, ...allValues }));
  };

  return (
    <div>
      <Form
        form={form}
        labelCol={{ span: 3 }}
        wrapperCol={{ span: 14 }}
        layout="horizontal"
        style={{ maxWidth: "50vw" }}
        onValuesChange={handleValuesChange}
      >
        <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter the name!' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Type" name="type" rules={[{ required: true, message: 'Please select a type!' }]}>
          <Select>
            <Select.Option value="generate">Generate</Select.Option>
            <Select.Option value="compare">Compare</Select.Option>
            <Select.Option value="extract-seed">Extract Seeds</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="Sub-Type" name="subType" rules={[{ required: true, message: 'Please select a sub-type!' }]}>
          <Select>
            <Select.Option value="tables">Tables</Select.Option>
            <Select.Option value="views">Views</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="Description" name="description">
          <TextArea rows={4} />
        </Form.Item>
      </Form>
    </div>
  );
};
