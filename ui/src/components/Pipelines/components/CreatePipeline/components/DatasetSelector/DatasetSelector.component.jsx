import { useMemo, useState, useEffect } from "react";
import { Checkbox, Input, Space, Switch, Typography } from "antd";
import { FixedSizeList as List } from "react-window";
import styles from "./DatasetSelector.module.css";
import { SearchOutlined } from "@ant-design/icons";
import AutoSizer from "react-virtualized-auto-sizer";

const DatasetSelector = ({ items, selected, defaultSelected = [], onChange, dynamicDatasetSelection, setDynamicDatasetSelection, searchable = true, disabled = false, title = "Items" }) => {
  const [internalSelected, setInternalSelected] = useState(defaultSelected);
  const isControlled = selected !== undefined;
  const selectedKeys = isControlled ? selected : internalSelected;

  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return items || [];
    const q = query.trim().toLowerCase();
    return (items || []).filter((t) => t.toLowerCase().includes(q));
  }, [items, query]);

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
    <div className={styles.datasetSelectorContainer}>
      <Space direction="vertical" style={{ width: "100%", height: "100%" }} size="small">
        <Space align="baseline" style={{ width: "100%" }}>
          <Typography.Text>Dynamic Dataset Selection</Typography.Text>
        <Switch checked={dynamicDatasetSelection} onChange={setDynamicDatasetSelection} />
        </Space>
        <Space align="baseline" style={{ justifyContent: "space-between", width: "100%" }}>
          <Typography.Text strong>{title}</Typography.Text>
          <Typography.Text type="secondary">
            {selectedKeys.length}/{items?.length || 0} selected
          </Typography.Text>
        </Space>
        {searchable && (
          <Input
            placeholder="Select Dataset.."
            prefix={<SearchOutlined />}
            className={styles.searchBox}
            allowClear
            disabled={disabled || dynamicDatasetSelection}
            onChange={(e) => setQuery(e.target.value)}
          />
        )}
        <Checkbox
          disabled={disabled || filtered.length === 0 || dynamicDatasetSelection}
          indeterminate={indeterminate}
          checked={allVisibleChecked}
          onChange={(e) => toggleAllVisible(e.target.checked)}
        >
          Select all {filtered.length > 0 ? `(${filtered.length} visible)` : ""}
        </Checkbox>

        <div className={styles.datasetsListingContainer}>
          {filtered.length === 0 ? (
            <Space direction="vertical" style={{ width: "100%", padding: 8 }}>
              <Typography.Text type="secondary">No items</Typography.Text>
            </Space>
          ) : (
            <div style={{ padding: 8, height: '100%', width: "100%" }}>
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    height={height}
                    itemCount={filtered.length}
                    itemSize={32}
                    width={width + 10}
                  >
                    {({ index, style }) => (
                      <div style={style}>
                        <Checkbox
                          disabled={disabled || dynamicDatasetSelection}
                          checked={selectedKeys.includes(filtered[index])}
                          onChange={(e) => onItemToggle(filtered[index], e.target.checked)}
                        >
                          {filtered[index]}
                        </Checkbox>
                      </div>
                    )}
                  </List>
                )}
              </AutoSizer>
            </div>
          )}
        </div>

        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Typography.Link onClick={dynamicDatasetSelection ? undefined : () => setSelected([])} aria-label="Clear selection" style={{ userSelect: "none", color: dynamicDatasetSelection ? '#ccc' : undefined, cursor: dynamicDatasetSelection ? 'not-allowed' : 'pointer' }}>
            Clear all
          </Typography.Link>
        </Space>
      </Space>
    </div>
  );
};

export default DatasetSelector;
