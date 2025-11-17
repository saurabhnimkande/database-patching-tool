import { useEffect, useState, useRef } from "react";
import "./App.css";
import { HeaderComponent } from "./components/header/header.component";
import { Pipelines } from "./components/Pipelines/Pipelines.component";
import { Sidebar } from "./components/Sidebar/Sidebar.component";
import { Layout, ConfigProvider, Spin, Typography, notification, App as AntdApp } from "antd";
import { CreatePipeline } from "./components/Pipelines/components/CreatePipeline/CreatePipeline.component";
import { DatabaseConfig } from "./components/DatabaseConfig/DatabaseConfig.component";
import { LoadingOutlined } from "@ant-design/icons";
import {ProgressIndicator} from "./components/ProgressIndicator/ProgressIndicator.component";
import { io } from "socket.io-client";
import { fetchPipelines as apiFetchPipelines } from "./services/apiService";
const { Header, Sider, Content } = Layout;

function App() {
  const [notificationApi, contextHolder] = notification.useNotification();
  const [currentView, setCurrentView] = useState('pipelines');
  const [pipelineData, setPipelineData] = useState(null);
  const [selectedComponentName, setSelectedComponentName] = useState(null);
  const [fullScreenLoading, setFullScreenLoading] = useState(false);
  const [fullScreenLoadingMessage, setFullScreenLoadingMessage] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [progresses, setProgresses] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  console.log('pipelines:', pipelines);

  const socketRef = useRef();

  const openNotification = (message = "", description = "", type = 'open') => {
    notificationApi[type]({
      message,
      description,
      showProgress: true,
      pauseOnHover: true,
    });
  };

  const handleFullScreenLoading = (flag, message = "") => {
    setFullScreenLoading(flag);
    setFullScreenLoadingMessage(message);
  };

  const showMessage = (type, content) => {
    if (type === 'success') {
      // Use notification for success messages to avoid the static message warning
      openNotification(content, '', 'success');
    } else if (type === 'error') {
      openNotification(content, '', 'error');
    }
  };

  const updateProgress = (pipelineId, name, progress, status) => {
    setProgresses(prev => {
      const existing = prev.find(p => p.id === pipelineId);
      if (existing) {
        return prev.map(p => p.id === pipelineId ? { ...p, progress, status } : p);
      } else {
        return [...prev, { id: pipelineId, name, progress, status }];
      }
    });
  };

  const handleSelectedComponent = (componentName, pipelineData = null) => {
    if (componentName === "pipelines") {
      setCurrentView("pipelines");
      setSelectedComponentName("Pipelines");
    } else if (componentName === "create-new-pipeline") {
      setCurrentView("create-new-pipeline");
      setPipelineData(pipelineData);
      setSelectedComponentName(pipelineData ? "Edit Pipeline" : "Create New Pipeline");
    } else if (componentName === "db-config") {
      setCurrentView("db-config");
      setSelectedComponentName("Database Configuration");
    } else {
      setCurrentView("wip");
      setSelectedComponentName("Work in progress");
    }
  };

  useEffect(() => {
    // Establish socket connection
    socketRef.current = io('http://localhost:3123');
    console.log('socketRef.current:', socketRef.current);

    socketRef.current.on('connect', () => {
      console.log('Connected to server in App:', socketRef.current.id);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server in App');
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const fetchPipelines = async () => {
    try {
      const response = await apiFetchPipelines();
      if (response.data && response.data.status === 'Success') {
        setPipelines(response.data.result);
      }
      handleSelectedComponent("pipelines");
    } catch (error) {
      console.error('Error fetching pipelines:', error);
      handleSelectedComponent("pipelines");
    }
  };

  useEffect(() => {
    // Fetch pipelines for lookup and set up progress listener
    fetchPipelines();
  }, []);

  useEffect(() => {
    if (!socketRef.current) return;

    const handleProgress = (data) => {
      const { pipelineId, status, progress, message } = data;
      console.log('Received pipeline-progress in App:', pipelineId, status, progress, message);
      const pipeline = pipelines.find(p => p.id === pipelineId);
      if (pipeline) {
        updateProgress(pipelineId, pipeline.name, progress || (status === 'Completed' ? 100 : 0), status);
      }
    };

    socketRef.current.on('pipeline-progress', handleProgress);

    return () => {
      socketRef.current.off('pipeline-progress', handleProgress);
    };
  }, [pipelines]);

  return (
    <AntdApp>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#8e25ebff",
            colorBgBase: "#ffffffff",
            colorTextBase: "#000000ff",
          },
          components: {
            Layout: {
              // component tokens
              bodyBg: "#f2f5f7",
              headerBg: "#f2f5f7",
              footerBg: "#111827",
              siderBg: "#ffffff",
              headerColor: "#e5e7eb",
              headerHeight: 88,
              headerPadding: 0,
            },
            Menu: {
              // Base look
              itemBg: "#ffffffff", // menu background (items area)
              itemColor: "rgb(117, 121, 128)",

              // Hover state
              itemHoverBg: "rgb(242, 245, 247)",
              itemHoverColor: "rgb(0, 0, 0)",

              // Selected state
              itemSelectedBg: "rgb(242, 245, 247)",
              itemSelectedColor: "rgb(0, 0, 0)",

              // Popup (when using vertical submenus)
              popupBg: "#0b1220",

              // Optional niceties
              groupTitleColor: "rgb(117, 121, 128)",
              groupTitleFontSize: 10,
              iconSize: 16,
              itemBorderRadius: 8,
            },
            Input: {
              colorBgContainer: "#fff",
              colorBorder: "#e6e6e6ff",
              activeShadow: "none", // no blue focus glow
              hoverBorderColor: "#bfbfbf",
            },
            Table: {
              headerBg: "#ffffffff",
              headerColor: "#1f2937",
              rowHoverBg: "rgba(250, 250, 250, 1)",
              rowSelectedBg: "#ffffffff",
              colorBgContainer: "#ffffff",
              // You can continue tuning other Table tokens as needed
            },
          },
        }}
      >
        {contextHolder}
        <Spin
          spinning={fullScreenLoading}
          fullscreen
          indicator={<LoadingOutlined spin />}
          tip={<Typography.Text style={{ fontSize: "1rem", color: "#ffffffff", fontWeight: 400 }}>{fullScreenLoadingMessage}</Typography.Text>}
          size="large"
        />
        <Layout style={{ minHeight: "100vh" }}>
          <Sider width={sidebarCollapsed ? 80 : 260} style={{ padding: sidebarCollapsed ? "0.75rem 0.25rem" : "0.75rem", transition: "all 0.3s ease" }}>
            <Sidebar handleSelectedComponent={handleSelectedComponent} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
          </Sider>
          <Layout>
            <Header style={{ lineHeight: "inherit" }}>
              <HeaderComponent selectedComponentName={selectedComponentName} />
            </Header>
            <Content>
              {currentView === 'pipelines' && <Pipelines handleSelectedComponent={handleSelectedComponent} showMessage={showMessage} updateProgress={updateProgress} progresses={progresses} socket={socketRef.current} pipelines={pipelines} fetchPipelines={fetchPipelines} />}
              {currentView === 'create-new-pipeline' && <CreatePipeline handleSelectedComponent={handleSelectedComponent} pipelineData={pipelineData} showMessage={showMessage} handleFullScreenLoading={handleFullScreenLoading} />}
              {currentView === 'db-config' && <DatabaseConfig handleSelectedComponent={handleSelectedComponent} handleFullScreenLoading={handleFullScreenLoading} openNotification={openNotification} />}
              {currentView === 'wip' && <div>Work in progress</div>}
            </Content>
          </Layout>
          <ProgressIndicator progresses={progresses} />
        </Layout>
      </ConfigProvider>
    </AntdApp>
  );
}

export default App;
