import { useState } from "react";
import styles from "./InfoCard.module.css";
export const InfoCard = ({ count, title, iconLink, type, iconLinkHover, handleSelectedComponent }) => {
  const [hover, setHover] = useState(false);

  const onMouseEnter = () => {
    setHover(true);
  };
  const onMouseLeave = () => {
    setHover(false);
  };

  return (
    <div
      className={`${styles.infoCardContainer} ${type === "add" && styles.cursorActive}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={type === "add" ? () => handleSelectedComponent("create-new-pipeline") : () => {}}
    >
      <div>
        <img src={type === "add" && hover ? iconLinkHover : iconLink} alt="Icon" className={styles.logoImage} />
      </div>
      <div className={styles.cardDetails}>
        {type !== "add" && <div>{count}</div>}

        <div>{title}</div>
      </div>
    </div>
  );
};
