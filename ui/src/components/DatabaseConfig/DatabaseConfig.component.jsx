import { Space, Table, Tooltip, Button, Modal } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import styles from "./DatabaseConfig.module.css";
import { useEffect, useState } from "react";
import { AddNewDatabase } from "./AddNewDatabase/AddNewDatabase.component";
import { axiosInstance } from "../../utils/axios.js";

export const DatabaseConfig = ({ handleFullScreenLoading, openNotification }) => {
  const [addNewDatabaseFlag, setAddNewDatabaseFlag] = useState(false);
  const [editDatabaseFlag, setEditDatabaseFlag] = useState(false);
  const [databaseToEdit, setDatabaseToEdit] = useState(null);
  const [databaseList, setDatabaseList] = useState([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [databaseToDelete, setDatabaseToDelete] = useState(null);

  useEffect(() => {
    fetchAddedDatabaseList()
  }, []);

  const goBack = () => {
    setAddNewDatabaseFlag(false);
    setEditDatabaseFlag(false);
    setDatabaseToEdit(null);
  };

  const handleEdit = (record) => {
    setDatabaseToEdit(record);
    setEditDatabaseFlag(true);
  };

  const fetchAddedDatabaseList = async () => {
    try {
      handleFullScreenLoading(true, "Fetching database list...");
      const response = await axiosInstance.get("/db-config/database-list");
      const resBody = response.data ?? {};
      let databaseList = resBody.result ?? [];
      console.log('databaseList:', databaseList);
      databaseList = databaseList.map((el, i) => ({...el, key: i}));
      setDatabaseList(databaseList);
      handleFullScreenLoading(false, "");
    } catch (error) {
      console.log("error:", error);
      handleFullScreenLoading(false, "");
      openNotification("Error", error.message, 'error');
    }
  };

  const deleteDatabase = async (name) => {
    try {
      handleFullScreenLoading(true, "Deleting database...");
      await axiosInstance.delete(`/db-config/delete-database/${name}`);
      openNotification("Success", "Database deleted successfully", 'success');
      fetchAddedDatabaseList(); // Refresh the list
    } catch (error) {
      console.log("error:", error);
      openNotification("Error", error.response?.data?.message || error.message, 'error');
    } finally {
      handleFullScreenLoading(false, "");
    }
  };

  const showDeleteModal = (name) => {
    setDatabaseToDelete(name);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = () => {
    if (databaseToDelete) {
      deleteDatabase(databaseToDelete);
    }
    setDeleteModalVisible(false);
    setDatabaseToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setDatabaseToDelete(null);
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name) => (
        <Space size="middle">
          <div className={styles.nameContainer}>{name}</div>
        </Space>
      ),
      ellipsis: true,
    },
    {
      title: "Creation Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => date ? new Date(date).toLocaleString() : "N/A",
    },
    {
      title: "Last update date",
      dataIndex: "updated_at",
      key: "updated_at",
      render: (date) => date ? new Date(date).toLocaleString() : "N/A",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (text, record) => (
        <Space size="middle">
          <Tooltip title="Delete Database Configuration">
            <Button type="text" icon={<DeleteOutlined />} onClick={() => showDeleteModal(record.name)} />
          </Tooltip>
          <Tooltip title="Edit Database Configuration">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const componentToggle = () => {
    setAddNewDatabaseFlag((el) => !el);
  };

  const handleBackOrAdd = () => {
    if (isFormVisible) {
      goBack();
    } else {
      componentToggle();
    }
  };

  const isFormVisible = addNewDatabaseFlag || editDatabaseFlag;

  return (
    <div className={styles.databaseConfigContainer}>
      <div className={styles.componentContainer}>
        <Button className={styles.actionButton} type="primary" onClick={handleBackOrAdd}>
          {isFormVisible ? "Back" : "Add new database"}
        </Button>
        {!isFormVisible ? (
          <Table
            columns={columns}
            dataSource={databaseList}
            pagination={{
              defaultPageSize: 6,
            }}
          />
        ) : (
          <AddNewDatabase
            handleFullScreenLoading={handleFullScreenLoading}
            openNotification={openNotification}
            goBack={goBack}
            isEdit={editDatabaseFlag}
            initialData={databaseToEdit}
            onSuccess={fetchAddedDatabaseList}
          />
        )}
      </div>
      <div>
        <img src="./database_img.jpg" alt="database-vector" className={styles.databaseVectorImage} />
      </div>
      <Modal
        title="Confirm Delete"
        open={deleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        okText="Yes"
        okType="danger"
        cancelText="No"
      >
        <p>Are you sure you want to delete the database configuration "{databaseToDelete}"?</p>
      </Modal>
    </div>
  );
};
