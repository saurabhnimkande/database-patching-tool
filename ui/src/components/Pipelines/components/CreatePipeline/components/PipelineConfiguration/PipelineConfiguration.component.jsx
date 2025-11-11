import { Form, Input, Select } from "antd";
import { useEffect } from "react";
const { TextArea } = Input;
export const PipelineConfiguration = ({ initialValues, onValuesChange }) => {
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
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 14 }}
        layout="horizontal"
        style={{ maxWidth: "50vw" }}
        onValuesChange={handleValuesChange}
      >
        <Form.Item label="Export File Name" name="exportFileName">
          <Input addonAfter=".sql" />
        </Form.Item>
        <Form.Item label="Export Mode" name="exportMode">
          <Select>
            <Select.Option value="single-file">Single File (All Data Combined)</Select.Option>
            <Select.Option value="multiple-file">Multiple Files (One Per Section)</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </div>
  );
};
