import { Form, Input, Select } from "antd";
import { pipelineTypes } from "../../../../../../config/pipelineTypes.js";

const { TextArea } = Input;

export const BasicSetup = () => {
  const type = Form.useWatch('type');

  const getSubTypeOptions = () => {
    if (!type || !pipelineTypes[type]) return [];
    return pipelineTypes[type].subtypes;
  };

  const isSubTypeRequired = type && pipelineTypes[type]?.subtypes.length > 0;

  return (
    <div style={{ maxWidth: "50vw" }}>
      <Form.Item label="Name" name="name" labelCol={{ span: 3 }} wrapperCol={{ span: 14 }} rules={[{ required: true, message: 'Please enter the name!' }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Type" name="type" labelCol={{ span: 3 }} wrapperCol={{ span: 14 }} rules={[{ required: true, message: 'Please select a type!' }]}>
        <Select>
          {Object.entries(pipelineTypes).map(([value, { label }]) => (
            <Select.Option key={value} value={value}>
              {label}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      {isSubTypeRequired && (
        <Form.Item label="Sub-Type" name="subType" labelCol={{ span: 3 }} wrapperCol={{ span: 14 }} rules={[{ required: true, message: 'Please select a sub-type!' }]}>
          <Select>
            {getSubTypeOptions().map(option => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      )}
      <Form.Item label="Description" name="description" labelCol={{ span: 3 }} wrapperCol={{ span: 14 }}>
        <TextArea rows={4} />
      </Form.Item>
    </div>
  );
};
