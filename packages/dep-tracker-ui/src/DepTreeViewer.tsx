import { Modal, Tree } from "antd";
import { DataNode } from "antd/es/tree";
import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "./api";
import { DepNode } from "./types";
import _ from "lodash";
import { produce } from "immer";

function findNodeById(nodes: DataNode[], key: string): DataNode | null {
  for (const node of nodes) {
    if (node.key === key) {
      return node;
    }
    if (node.children) {
      const result = findNodeById(node.children, key);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

function mapDepNodeToDataNode(
  depNode: DepNode,
  depNodeIdKeyMap: Map<string, number>,
): DataNode {
  const key = _.uniqueId();
  depNodeIdKeyMap.set(key, depNode.id);

  return {
    key,
    title: `${depNode.dirName}${depNode.fileName}[${depNode.dependencyCount}]`,
    isLeaf: false,
  };
}

export const DepTreeViewer: React.FC<{
  id: string;
  visible: boolean;
  onClose: () => void;
}> = ({ id, onClose, visible }) => {
  const [treeData, setTreeData] = useState<DataNode[] | undefined>();
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const depNodeIdKeyMap = useRef(new Map<string, number>());

  const fetchTreeNode = useCallback(
    async (chunkId?: number) => {
      const depChunks = await api.getDepChunks(id, chunkId);

      const root = depChunks.root;

      return [
        {
          ...mapDepNodeToDataNode(root, depNodeIdKeyMap.current),
          children: depChunks.deps.map((chunk) =>
            mapDepNodeToDataNode(chunk, depNodeIdKeyMap.current),
          ),
        },
      ] as DataNode[];
    },
    [id],
  );

  useEffect(() => {
    if (visible) {
      fetchTreeNode().then((data) => {
        setTreeData(data);
        setExpandedKeys([data[0].key]);
      });
    } else {
      depNodeIdKeyMap.current.clear();
      setTreeData([]);
    }
  }, [visible, fetchTreeNode]);

  return (
    <Modal
      title="查看依赖树"
      open={visible}
      onCancel={onClose}
      width="calc(100vw - 32px)"
    >
      <Tree
        treeData={treeData}
        expandedKeys={expandedKeys}
        onExpand={(expandedKeys, { node }) => {
          setExpandedKeys(expandedKeys);

          const nodeKey = node.key as string;

          if (_.isEmpty(node.children) && treeData != null) {
            fetchTreeNode(depNodeIdKeyMap.current.get(nodeKey)).then((data) => {
              setTreeData(
                produce(treeData, (draft) => {
                  const node = findNodeById(draft, nodeKey);

                  if (node) {
                    node.children = data[0].children;
                  }
                }),
              );
            });
          }
        }}
      />
    </Modal>
  );
};
