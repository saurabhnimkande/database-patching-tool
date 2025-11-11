import { Space, Table, Tooltip, Spin } from "antd";
import { CaretRightOutlined, DeleteOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { axiosInstance } from "../../../../utils/axios";
import styles from "./PipelineTable.module.css";

export const PipelineTable = ({ handleSelectedComponent, onEditPipeline }) => {
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        const response = await axiosInstance.get('/pipelines/list');
        if (response.data.status === 'Success') {
          setPipelines(response.data.result);
        }
      } catch (error) {
        console.error('Error fetching pipelines:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPipelines();
  }, []);
  const columns = [
    {
      title: "",
      width: "1rem",
      key: "action-toggle",
      render: () => (
        <Space size="middle">
          <Tooltip title="Start Pipeline">
            <CaretRightOutlined className={styles.playButton} />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <Space size="middle">
          <div className={styles.nameContainer} onClick={() => onEditPipeline(record)}>
            {name}
          </div>
        </Space>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Last Success",
      dataIndex: "last-success",
      key: "last-success",
    },
    {
      title: "Last Duration",
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
          <Tooltip title="Delete Pipeline">
            <DeleteOutlined className={styles.deleteButton} />
          </Tooltip>
        </Space>
      ),
    },
  ];
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Table
      columns={columns}
      dataSource={pipelines}
      pagination={{
        defaultPageSize: 6,
      }}
      rowKey="id"
    />
  );
};
