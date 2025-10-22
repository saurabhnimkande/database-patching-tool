import styles from "./Header.module.css";
export const HeaderComponent = ({selectedComponentName}) => {
  return <div className={styles.headerContainer}>{selectedComponentName}</div>;
};
