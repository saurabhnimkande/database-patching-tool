import React, { useState } from "react";
import { Progress, Typography } from "antd";
import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./ProgressIndicator.module.css";

const { Text } = Typography;

export const ProgressIndicator = ({ progresses = [] }) => {
  const [expanded, setExpanded] = useState(false);

  if (progresses.length === 0) return null;

  const displayedProgresses = expanded ? progresses : progresses.slice(0, 1);

  return (
    <AnimatePresence>
      <motion.div
        key={expanded ? "expanded" : "collapsed"}
        className={styles.container}
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ duration: 1, type: "spring" }}
      >
        {progresses.length > 1 && (
          <div className={styles.expandIcon} onClick={() => setExpanded(!expanded)}>
            {expanded ? (
              <DownOutlined 
                style={{ cursor: "pointer", color: "#666", fontSize: "14px" }}
              />
            ) : (
              <UpOutlined
                style={{ cursor: "pointer", color: "#666", fontSize: "14px" }}
              />
            )}
          </div>
        )}
        {displayedProgresses.map((item) => (
          <div key={item.id} className={styles.progressItem}>
            <Text className={styles.processName}>{item.name}</Text>
            <Progress
              percent={item.progress}
              size="small"
              status={item.progress === 100 ? "success" : "active"}
              showInfo={true}
              strokeColor="#8e25eb"
              className={styles.progressBar}
            />
          </div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};
