import { useMemo, useState, useEffect } from "react";
import { Checkbox, Input, Space, Typography } from "antd";
import { FixedSizeList as List } from "react-window";
import styles from "./TableSelector.module.css";
import { SearchOutlined } from "@ant-design/icons";

const TableSelector = ({ tables, selected, defaultSelected = [], onChange, searchable = true, disabled = false, title = "Tables" }) => {
  const [internalSelected, setInternalSelected] = useState(defaultSelected);
  const isControlled = selected !== undefined;
  const selectedKeys = isControlled ? selected : internalSelected;

  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return tables || [];
    const q = query.trim().toLowerCase();
    return (tables || []).filter((t) => t.toLowerCase().includes(q));
  }, [tables, query]);

  const allVisibleChecked = filtered.length > 0 && filtered.every((t) => selectedKeys.includes(t));
  const someVisibleChecked = filtered.some((t) => selectedKeys.includes(t));
  const indeterminate = someVisibleChecked && !allVisibleChecked;

  const setSelected = (next) => {
    if (!isControlled) setInternalSelected(next);
    if (onChange) onChange(next);
  };

  const toggleAllVisible = (checked) => {
    if (checked) {
      const union = Array.from(new Set([...(selectedKeys || []), ...filtered]));
      setSelected(union);
    } else {
      const remaining = (selectedKeys || []).filter((k) => !filtered.includes(k));
      setSelected(remaining);
    }
  };

  const onItemToggle = (name, checked) => {
    if (checked) {
      if (!selectedKeys.includes(name)) setSelected([...selectedKeys, name]);
    } else {
      setSelected(selectedKeys.filter((k) => k !== name));
    }
  };

  useEffect(() => {
    if (isControlled) setInternalSelected(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isControlled, selected && selected.join("|")]);

  return (
    <div className={styles.tableSelectorContainer}>
      <Space direction="vertical" style={{ width: "100%", height: "100%" }} size="small">
        <Space align="baseline" style={{ justifyContent: "space-between", width: "100%" }}>
          <Typography.Text strong>{title}</Typography.Text>
          <Typography.Text type="secondary">
            {selectedKeys.length}/{tables?.length || 0} selected
          </Typography.Text>
        </Space>
        {searchable && (
          <Input
            placeholder="Select Dataset.."
            prefix={<SearchOutlined />}
            className={styles.searchBox}
            allowClear
            disabled={disabled}
            onChange={(e) => setQuery(e.target.value)}
          />
        )}
        <Checkbox
          disabled={disabled || filtered.length === 0}
          indeterminate={indeterminate}
          checked={allVisibleChecked}
          onChange={(e) => toggleAllVisible(e.target.checked)}
        >
          Select all {filtered.length > 0 ? `(${filtered.length} visible)` : ""}
        </Checkbox>

        <div className={styles.tablesListingContainer}>
          {filtered.length === 0 ? (
            <Space direction="vertical" style={{ width: "100%", padding: 8 }}>
              <Typography.Text type="secondary">No tables</Typography.Text>
            </Space>
          ) : (
            <div style={{ padding: 8 }}>
              <List
                height={340}
                itemCount={filtered.length}
                itemSize={32}
                width="100%"
              >
                {({ index, style }) => (
                  <div style={style}>
                    <Checkbox
                      disabled={disabled}
                      checked={selectedKeys.includes(filtered[index])}
                      onChange={(e) => onItemToggle(filtered[index], e.target.checked)}
                    >
                      {filtered[index]}
                    </Checkbox>
                  </div>
                )}
              </List>
            </div>
          )}
        </div>

        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Typography.Link onClick={() => setSelected([])} aria-label="Clear selection" style={{ userSelect: "none" }}>
            Clear all
          </Typography.Link>
        </Space>
      </Space>
    </div>
  );
};

export default TableSelector;
