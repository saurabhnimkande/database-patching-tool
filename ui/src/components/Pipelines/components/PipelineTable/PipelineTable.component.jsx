import { Space, Table, Tooltip, Spin, Modal } from "antd";
import { CaretRightOutlined, DeleteOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { axiosInstance } from "../../../../utils/axios";
import styles from "./PipelineTable.module.css";

export const PipelineTable = ({ onEditPipeline, showMessage }) => {
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [pipelineToDelete, setPipelineToDelete] = useState(null);

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

  const handleDelete = (record) => {
    setPipelineToDelete(record);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    try {
      await axiosInstance.delete(`/pipelines/${pipelineToDelete.id}`);
      showMessage('success', 'Pipeline deleted successfully');
      // Refresh the list
      const response = await axiosInstance.get('/pipelines/list');
      if (response.data.status === 'Success') {
        setPipelines(response.data.result);
      }
    } catch (error) {
      console.error('Error deleting pipeline:', error);
      showMessage('error', 'Failed to delete pipeline');
    } finally {
      setDeleteModalVisible(false);
      setPipelineToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setPipelineToDelete(null);
  };

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
      render: (lastSuccess) => lastSuccess ? lastSuccess : "N/A",
    },
    {
      title: "Last Duration",
      dataIndex: "last-duration",
      key: "last-duration",
      render: (lastDuration) => lastDuration ? lastDuration : "N/A",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (description) => description ? description : "N/A",
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (text, record) => (
        <Space size="middle">
          <Tooltip title="Delete Pipeline">
            <DeleteOutlined className={styles.deleteButton} onClick={() => handleDelete(record)} />
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
    <>
      <Table
        columns={columns}
        dataSource={pipelines}
        pagination={{
          defaultPageSize: 6,
        }}
        rowKey="id"
      />
      <Modal
        title="Delete Pipeline"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={cancelDelete}
        okText="Delete"
        cancelText="Cancel"
        okType="danger"
      >
        <p>Are you sure you want to delete the pipeline "{pipelineToDelete?.name}"?</p>
      </Modal>
    </>
  );
};
