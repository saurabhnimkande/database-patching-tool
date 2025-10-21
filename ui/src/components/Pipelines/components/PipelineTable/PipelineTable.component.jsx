import { Space, Table, Tag } from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";
import styles from "./PipelineTable.module.css";

export const PipelineTable = () => {
  const columns = [
    {
      title: "",
      width: "1rem",
      key: "action-toggle",
      render: () => (
        <Space size="middle">
          <PlayCircleOutlined className={styles.playButton} />
        </Space>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
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
  return (
    <Table
      columns={columns}
      dataSource={data}
      pagination={{
        defaultPageSize: 6,
      }}
    />
  );
};
