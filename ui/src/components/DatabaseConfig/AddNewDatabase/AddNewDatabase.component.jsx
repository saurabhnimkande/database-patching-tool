import { Form, Input, Button, Switch } from "antd";
const { TextArea } = Input;
import styles from "./AddNewDatabase.module.css";
import { useState } from "react";
import { axiosInstance } from "../../../utils/axios.js";

export const AddNewDatabase = ({ handleFullScreenLoading, openNotification, goBack }) => {
  const [form] = Form.useForm();
  const [formData, setFormData] = useState({
    name: "",
    type: "PostgreSQL",
    host: "",
    database: "",
    user: "",
    password: "",
    port: "",
    ssl: false,
    description: "",
  });
  const [disableSave, setDisableSave] = useState(true);
  console.log("formData", formData);

  const handleChange = (e) => {
    setDisableSave(true);
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const testConnection = async () => {
    try {
      handleFullScreenLoading(true, "Testing connection...");
      const response = await axiosInstance.post("/db-config/test-connection", formData);
      console.log("response:", response);
      const resBody = response.data ?? {};
      handleFullScreenLoading(false, "");
      openNotification(resBody.status, resBody.message);
      setDisableSave(false);
    } catch (error) {
      console.log("error:", error);
      handleFullScreenLoading(false, "");
      openNotification("Error", error.message);
    }
  };

  const handleExternalSubmit = async () => {
    try {
      await form.validateFields();
      handleFullScreenLoading(true, "Adding database credentials...");
      const response = await axiosInstance.post("/db-config/add-database", formData);
      const resBody = response.data ?? {};
      console.log("resBody:", resBody);
      handleFullScreenLoading(false, "");
      openNotification(resBody.status, resBody.message);
      goBack();
    } catch (error) {
      console.error("Validation failed:", error);
      openNotification("Error", error.message);
    }
  };

  const handleTestConnection = async () => {
    try {
      await form.validateFields();
      await testConnection();
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  return (
    <>
      <Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 14 }} layout="horizontal" style={{ maxWidth: "50vw" }}>
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Name is required!" }]} // Making the field mandatory
        >
          <Input name="name" value={formData.name} onChange={handleChange} />
        </Form.Item>

        <Form.Item label="Type">
          <Input name="type" value={formData.type} disabled onChange={handleChange} />
        </Form.Item>

        <Form.Item
          label="Database Host"
          name="host"
          rules={[{ required: true, message: "Database host is required!" }]} // Making the field mandatory
        >
          <Input name="host" value={formData.host} onChange={handleChange} />
        </Form.Item>

        <Form.Item
          label="Database"
          name="database"
          rules={[{ required: true, message: "Database name is required!" }]} // Making the field mandatory
        >
          <Input name="database" value={formData.database} onChange={handleChange} />
        </Form.Item>

        <Form.Item
          label="Database User"
          name="user"
          rules={[{ required: true, message: "Database user is required!" }]} // Making the field mandatory
        >
          <Input name="user" value={formData.user} onChange={handleChange} />
        </Form.Item>

        <Form.Item
          label="Database Password"
          name="password"
          rules={[{ required: true, message: "Password is required!" }]} // Making the field mandatory
        >
          <Input.Password name="password" value={formData.password} onChange={handleChange} />
        </Form.Item>

        <Form.Item label="Database Port" name="port" rules={[{ required: true, message: "Port is required!" }]}>
          <Input name="port" type="number" value={formData.port} onChange={handleChange} />
        </Form.Item>

        <Form.Item label="SSL" name="ssl">
          <Switch name="ssl" checked={formData.ssl} onChange={(checked) => handleChange({ target: { name: "ssl", value: checked } })} />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <TextArea name="description" rows={4} value={formData.description} onChange={handleChange} />
        </Form.Item>
      </Form>
      <div>
        <Button type="primary" onClick={handleTestConnection}>
          Test Connection
        </Button>
        <Button className={styles.saveButton} type="primary" onClick={handleExternalSubmit} disabled={disableSave}>
          Save
        </Button>
      </div>
    </>
  );
};
