import { InfoCard } from "./components/InfoCard/InfoCard.component";
import { PipelineTable } from "./components/PipelineTable/PipelineTable.component";
import styles from "./Pipelines.module.css";

export const Pipelines = ({handleSelectedComponent}) => {
  const handleEditPipeline = (pipeline) => {
    handleSelectedComponent("create-new-pipeline", pipeline);
  };
  const statusCardsData = [
    {
      type: "add",
      title: "Add Pipeline",
      iconLink: "/icons/add-new.png",
      iconLinkHover: "/icons/add-new-hover.png",
    },
    {
      count: 1,
      title: "In-Progress Pipelines",
      iconLink: "/icons/data.png",
    },
    {
      count: 4,
      title: "In-Queue Pipelines",
      iconLink: "/icons/queue.png",
    },
    {
      count: 2,
      title: "Failed Pipelines",
      iconLink: "/icons/fail.png",
    },
  ];

  return (
    <div className={styles.pipelinesContainer}>
      <div className={styles.cardsContainer}>
        {statusCardsData.map((el, i) => (
          <InfoCard
            key={i}
            count={el.count}
            title={el.title}
            iconLink={el.iconLink}
            type={el.type}
            iconLinkHover={el.iconLinkHover}
            handleSelectedComponent={handleSelectedComponent}
          />
        ))}
      </div>
      <div className={styles.pipelinesSubContainer}>
        <PipelineTable handleSelectedComponent={handleSelectedComponent} onEditPipeline={handleEditPipeline} />
      </div>
    </div>
  );
};
