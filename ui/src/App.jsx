import { useEffect, useState } from "react";
import "./App.css";
import { HeaderComponent } from "./components/header/header.component";
import { Pipelines } from "./components/Pipelines/Pipelines.component";
import { Sidebar } from "./components/sidebar/sidebar.component";
import { Layout, ConfigProvider } from "antd";
import { CreatePipeline } from "./components/Pipelines/components/CreatePipeline/CreatePipeline.component";
const { Header, Sider, Content } = Layout;

function App() {
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [selectedComponentName, setSelectedComponentName] = useState(null);

  const handleSelectedComponent = (componentName) => {
    if (componentName === "pipelines") {
      setSelectedComponent(<Pipelines handleSelectedComponent={handleSelectedComponent} />);
      setSelectedComponentName("Pipelines");
    } else if (componentName === "create-new-pipeline") {
      setSelectedComponent(<CreatePipeline handleSelectedComponent={handleSelectedComponent} />);
      setSelectedComponentName("Create New Pipeline");
    } else {
      setSelectedComponent(<div>Work in progress</div>);
      setSelectedComponentName("Work in progress");
    }
  };

  useEffect(() => {
    handleSelectedComponent("pipelines");
  }, []);

  return (
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
      <Layout style={{ minHeight: "100vh" }}>
        <Sider width={260} style={{ padding: "0.75rem" }}>
          <Sidebar handleSelectedComponent={handleSelectedComponent} />
        </Sider>
        <Layout>
          <Header style={{ lineHeight: "inherit" }}>
            <HeaderComponent selectedComponentName={selectedComponentName} />
          </Header>
          <Content>{selectedComponent}</Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
