import { useEffect, useState } from "react";
import "./App.css";
import { HeaderComponent } from "./components/header/header.component";
import { Pipelines } from "./components/Pipelines/Pipelines.component";
import { Sidebar } from "./components/Sidebar/Sidebar.component";
import { Layout, ConfigProvider, Spin, Typography, notification, App as AntdApp } from "antd";
import { CreatePipeline } from "./components/Pipelines/components/CreatePipeline/CreatePipeline.component";
import { DatabaseConfig } from "./components/DatabaseConfig/DatabaseConfig.component";
import { LoadingOutlined } from "@ant-design/icons";
const { Header, Sider, Content } = Layout;

function App() {
  const [notificationApi, contextHolder] = notification.useNotification();
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [selectedComponentName, setSelectedComponentName] = useState(null);
  const [fullScreenLoading, setFullScreenLoading] = useState(false);
  const [fullScreenLoadingMessage, setFullScreenLoadingMessage] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const handleSelectedComponent = (componentName, pipelineData = null) => {
    if (componentName === "pipelines") {
      setSelectedComponent(<Pipelines handleSelectedComponent={handleSelectedComponent} showMessage={showMessage} />);
      setSelectedComponentName("Pipelines");
    } else if (componentName === "create-new-pipeline") {
      setSelectedComponent(<CreatePipeline handleSelectedComponent={handleSelectedComponent} pipelineData={pipelineData} showMessage={showMessage} />);
      setSelectedComponentName(pipelineData ? "Edit Pipeline" : "Create New Pipeline");
    } else if (componentName === "db-config") {
      setSelectedComponent(<DatabaseConfig handleSelectedComponent={handleSelectedComponent} handleFullScreenLoading={handleFullScreenLoading} openNotification={openNotification} />);
      setSelectedComponentName("Database Configuration");
    } else {
      setSelectedComponent(<div>Work in progress</div>);
      setSelectedComponentName("Work in progress");
    }
  };

  useEffect(() => {
    handleSelectedComponent("pipelines");
  }, []);

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
            <Content>{selectedComponent}</Content>
          </Layout>
        </Layout>
      </ConfigProvider>
    </AntdApp>
  );
}

export default App;
