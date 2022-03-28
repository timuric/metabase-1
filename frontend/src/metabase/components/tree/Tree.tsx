import React, { useState, useCallback, useEffect } from "react";
import { usePrevious } from "metabase/hooks/use-previous";
import { TreeNodeList } from "./TreeNodeList";
import { TreeNode as DefaultTreeNode } from "./TreeNode";
import { getInitialExpandedIds } from "./utils";
import { ITreeNodeItem, TreeNodeComponent } from "./types";

interface TreeProps {
  data: ITreeNodeItem[];
  selectedId?: ITreeNodeItem["id"];
  emptyState?: React.ReactNode;
  onSelect?: (item: ITreeNodeItem) => void;
  TreeNode?: TreeNodeComponent;
}

function BaseTree({
  data,
  selectedId,
  emptyState = null,
  onSelect,
  TreeNode = DefaultTreeNode,
}: TreeProps) {
  const [expandedIds, setExpandedIds] = useState(
    new Set(selectedId != null ? getInitialExpandedIds(selectedId, data) : []),
  );
  const previousSelectedId = usePrevious(selectedId);
  const prevData = usePrevious(data);

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    const selectedItemChanged =
      previousSelectedId !== selectedId && !expandedIds.has(selectedId);
    const itemsChanged = prevData !== data;
    if (selectedItemChanged || itemsChanged) {
      setExpandedIds(
        prev => new Set([...prev, ...getInitialExpandedIds(selectedId, data)]),
      );
    }
  }, [prevData, data, selectedId, previousSelectedId, expandedIds]);

  const handleToggleExpand = useCallback(
    itemId => {
      if (expandedIds.has(itemId)) {
        setExpandedIds(prev => new Set([...prev].filter(id => id !== itemId)));
      } else {
        setExpandedIds(prev => new Set([...prev, itemId]));
      }
    },
    [expandedIds],
  );

  if (data.length === 0) {
    return <React.Fragment>{emptyState}</React.Fragment>;
  }

  return (
    <TreeNodeList
      items={data}
      TreeNode={TreeNode}
      expandedIds={expandedIds}
      selectedId={selectedId}
      depth={0}
      onSelect={onSelect}
      onToggleExpand={handleToggleExpand}
    />
  );
}

export const Tree = Object.assign(BaseTree, {
  Node: DefaultTreeNode,
});
