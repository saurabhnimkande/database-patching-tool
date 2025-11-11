import { Space, Table, Tooltip, Button } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import styles from "./DatabaseConfig.module.css";
import { useEffect, useState } from "react";
import { AddNewDatabase } from "./AddNewDatabase/AddNewDatabase.component";
import { axiosInstance } from "../../utils/axios.js";
export const DatabaseConfig = ({ handleFullScreenLoading, openNotification }) => {
  const [addNewDatabaseFlag, setAddNewDatabaseFlag] = useState(false);
  const [databaseList, setDatabaseList] = useState([]);

  useEffect(() => {
    fetchAddedDatabaseList()
  }, []);

  const goBack = () => {
    setAddNewDatabaseFlag(false);
  };

  const fetchAddedDatabaseList = async () => {
    try {
      handleFullScreenLoading(true, "Fetching database list...");
      const response = await axiosInstance.get("/db-config/database-list");
      const resBody = response.data ?? {};
      let databaseList = resBody.result ?? [];
      console.log('databaseList:', databaseList);
      databaseList = databaseList.map((el, i) => ({...el, key: i, 'last-duration': "N/A", "last-success": "N/A"}));
      setDatabaseList(databaseList);
      handleFullScreenLoading(false, "");
    } catch (error) {
      console.log("error:", error);
      handleFullScreenLoading(false, "");
      openNotification("Error", error.message);
    }
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
    },
    {
      title: "Creation Date",
      dataIndex: "last-success",
      key: "last-success",
    },
    {
      title: "Last update date",
      dataIndex: "last-duration",
      key: "last-duration",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: () => (
        <Space size="middle">
          <Tooltip title="Delete Database Configuration">
            <DeleteOutlined className={styles.deleteButton} />
          </Tooltip>
          <Tooltip title="Edit Database Configuration">
            <EditOutlined className={styles.deleteButton} />
          </Tooltip>
        </Space>
      ),
    },
  ];
  const data = [
    {
      key: "1",
      name: "Dev1 Create Tables",
      type: "Generate",
      status: "In-Progress",
      "last-duration": "10 mins",
      "last-success": "3 days ago",
      description: "To generate table script",
    },
    {
      key: "2",
      name: "QA to demo3",
      status: "Ready to start",
      type: "Compare",
      "last-duration": "10 mins",
      "last-success": "3 days ago",
      description: "Comparing QA with demo3",
    },
    {
      key: "3",
      name: "QA to demo6",
      status: "Ready to start",
      type: "Extract Seeds",
      "last-duration": "10 mins",
      "last-success": "3 days ago",
      description: "abc",
    },
    {
      key: "4",
      name: "QA to demo6",
      status: "Ready to start",
      type: "Compare",
      "last-duration": "10 mins",
      "last-success": "3 days ago",
      description: "abc",
    },
    {
      key: "5",
      name: "QA to demo6",
      status: "Ready to start",
      type: "Compare",
      "last-duration": "10 mins",
      "last-success": "3 days ago",
      description: "abc",
    },
    {
      key: "6",
      name: "QA to demo6",
      status: "Ready to start",
      type: "Compare",
      "last-duration": "10 mins",
      "last-success": "3 days ago",
      description: "abc",
    },
    {
      key: "7",
      name: "QA to demo6",
      status: "Ready to start",
      type: "Compare",
      "last-duration": "10 mins",
      "last-success": "3 days ago",
      description: "abc",
    },
    {
      key: "8",
      name: "QA to demo6",
      status: "Ready to start",
      type: "Compare",
      "last-duration": "10 mins",
      "last-success": "3 days ago",
      description: "abc",
    },
    {
      key: "9",
      name: "QA to demo6",
      status: "Ready to start",
      type: "Compare",
      "last-duration": "10 mins",
      "last-success": "3 days ago",
      description: "abc",
    },
  ];

  const componentToggle = () => {
    setAddNewDatabaseFlag((el) => !el);
  };
  return (
    <div className={styles.databaseConfigContainer}>
      <div className={styles.componentContainer}>
        <Button className={styles.actionButton} type="primary" onClick={componentToggle}>
          {addNewDatabaseFlag ? "Back" : "Add new database"}
        </Button>
        {!addNewDatabaseFlag ? (
          <Table
            columns={columns}
            dataSource={databaseList}
            pagination={{
              defaultPageSize: 6,
            }}
          />
        ) : (
          <AddNewDatabase handleFullScreenLoading={handleFullScreenLoading} openNotification={openNotification} goBack={goBack} />
        )}
      </div>
      <div>
        <img src="./database_img.jpg" alt="database-vector" className={styles.databaseVectorImage} />
      </div>
    </div>
  );
};
