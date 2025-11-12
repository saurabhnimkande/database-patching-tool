import { Form, Input, Button, Switch } from "antd";
const { TextArea } = Input;
import styles from "./AddNewDatabase.module.css";
import { useState, useEffect } from "react";
import { axiosInstance } from "../../../utils/axios.js";

export const AddNewDatabase = ({ handleFullScreenLoading, openNotification, goBack, isEdit = false, initialData = null, onSuccess }) => {
  const [form] = Form.useForm();
  const [disableSave, setDisableSave] = useState(true);

  useEffect(() => {
    if (isEdit && initialData) {
      form.setFieldsValue(initialData);
      setDisableSave(false); // Allow save without testing connection for edits initially
    } else {
      setDisableSave(true);
    }
  }, [isEdit, initialData, form]);

  // Watch for form changes
  const formValues = Form.useWatch([], form);
  useEffect(() => {
    if (isEdit && initialData && formValues) {
      // Check if current values differ from initial data
      const hasChanged = Object.keys(formValues).some((key) => {
        return formValues[key] !== initialData[key];
      });
      setDisableSave(hasChanged);
    }
  }, [formValues, initialData, isEdit]);

  const testConnection = async () => {
    try {
      const values = form.getFieldsValue();
      handleFullScreenLoading(true, "Testing connection...");
      const response = await axiosInstance.post("/db-config/test-connection", values);
      console.log("response:", response);
      const resBody = response.data ?? {};
      handleFullScreenLoading(false, "");
      openNotification(resBody.status, resBody.message, "success");
      if (resBody.status === "Error") {
        setDisableSave(true);
      } else {
        setDisableSave(false);
      }
    } catch (error) {
      console.log("error:", error);
      handleFullScreenLoading(false, "");
      openNotification("Error", error.message, "error");
      setDisableSave(true);
    }
  };

  const handleExternalSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (isEdit) {
        await handleUpdateSubmit(values);
      } else {
        await handleAddSubmit(values);
      }
    } catch (error) {
      console.error("Validation failed:", error);
      openNotification("Error", error.message, "error");
    }
  };

  const handleAddSubmit = async (data) => {
    const now = new Date().toISOString();
    data.created_at = now;
    handleFullScreenLoading(true, "Adding database credentials...");
    const response = await axiosInstance.post("/db-config/add-database", data);
    const resBody = response.data ?? {};
    console.log("resBody:", resBody);
    handleFullScreenLoading(false, "");
    openNotification(resBody.status, resBody.message, resBody?.status?.toLowerCase());
    if (onSuccess) onSuccess();
    goBack();
  };

  const handleUpdateSubmit = async (data) => {
    data.updated_at = new Date().toISOString();
    handleFullScreenLoading(true, "Updating database credentials...");
    const response = await axiosInstance.put(`/db-config/update-database/${data.name}`, data);
    const resBody = response.data ?? {};
    console.log("resBody:", resBody);
    handleFullScreenLoading(false, "");
    openNotification(resBody.status, resBody.message, resBody?.status?.toLowerCase());
    if (onSuccess) onSuccess();
    goBack();
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
      <Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 14 }} layout="horizontal" style={{ maxWidth: "100%" }}>
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Name is required!" }]} // Making the field mandatory
        >
          <Input disabled={isEdit} />
        </Form.Item>

        <Form.Item label="Type" name="type">
          <Input disabled defaultValue={"PostgreSQL"} />
        </Form.Item>

        <Form.Item
          label="Database Host"
          name="host"
          rules={[{ required: true, message: "Database host is required!" }]} // Making the field mandatory
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Database"
          name="database"
          rules={[{ required: true, message: "Database name is required!" }]} // Making the field mandatory
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Database User"
          name="user"
          rules={[{ required: true, message: "Database user is required!" }]} // Making the field mandatory
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Database Password"
          name="password"
          rules={[{ required: true, message: "Password is required!" }]} // Making the field mandatory
        >
          <Input.Password />
        </Form.Item>

        <Form.Item label="Database Port" name="port" rules={[{ required: true, message: "Port is required!" }]}>
          <Input type="number" />
        </Form.Item>

        <Form.Item label="SSL" name="ssl" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <TextArea rows={4} />
        </Form.Item>
      </Form>
      <div>
        <Button type="primary" onClick={handleTestConnection}>
          Test Connection
        </Button>
        <Button className={styles.saveButton} type="primary" onClick={handleExternalSubmit} disabled={disableSave}>
          {isEdit ? "Update" : "Save"}
        </Button>
      </div>
    </>
  );
};
