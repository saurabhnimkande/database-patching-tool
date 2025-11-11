import { Form, Input, Select } from "antd";
import { useEffect } from "react";
const { TextArea } = Input;
export const BasicSetup = ({ initialValues, onValuesChange }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  return (
    <div>
      <Form
        form={form}
        labelCol={{ span: 3 }}
        wrapperCol={{ span: 14 }}
        layout="horizontal"
        style={{ maxWidth: "50vw" }}
        onValuesChange={onValuesChange}
      >
        <Form.Item label="Name" name="name">
          <Input />
        </Form.Item>
        <Form.Item label="Type" name="type">
          <Select>
            <Select.Option value="generate">Generate</Select.Option>
            <Select.Option value="compare">Compare</Select.Option>
            <Select.Option value="extract-seed">Extract Seeds</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="Sub-Type" name="subType">
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
