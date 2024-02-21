/**
 * 查看某个 chunk 的依赖
 */
import { useRequest } from "ahooks";
import { Breadcrumb, Modal, Table, Tag } from "antd";
import React, { useEffect, useState } from "react";
import * as api from "./api";
import { DepNode } from "./types";

export const DepChunksViewer: React.FC<{
  id: string;
  chunk?: DepNode | null;
  onClose: () => void;
}> = ({ id, chunk, onClose }) => {
  const [breadcrumbs, setBreadcrumbs] = useState<DepNode[]>([]);

  const { data, loading, run } = useRequest(
    async (chunk: DepNode, insertBreadcrumbs = true) => {
      const depChunks = await api.getDepChunks(id, chunk.id);
      if (insertBreadcrumbs) {
        setBreadcrumbs((prev) => [...prev, chunk]);
      }
      return depChunks;
    },
    {
      manual: true,
    },
  );

  useEffect(() => {
    if (chunk != null) {
      run(chunk);
    } else {
      setBreadcrumbs([]);
    }
  }, [chunk, run]);

  return (
    <Modal
      title="查看依赖方"
      open={chunk != null}
      onCancel={onClose}
      width="calc(100vw - 32px)"
    >
      <Breadcrumb className="leading-8">
        {breadcrumbs.map((node, index) => (
          <Breadcrumb.Item
            key={node.id}
            onClick={() => {
              setBreadcrumbs(breadcrumbs.slice(0, index + 1));
              run(node, false);
            }}
          >
            <Tag className="!mr-0">
              {node.dirName}
              {node.fileName}[{node.depth}]
            </Tag>
          </Breadcrumb.Item>
        ))}
      </Breadcrumb>

      <Table
        className="mt-2"
        loading={loading}
        dataSource={data}
        columns={[
          {
            title: "文件名",
            dataIndex: "fileName",
            key: "fileName",
          },
          {
            title: "目录名",
            dataIndex: "dirName",
            key: "dirName",
          },
          {
            title: "深度",
            dataIndex: "depth",
            align: "right",
          },
          {
            title: "行数",
            dataIndex: "loc",
            key: "loc",
            align: "right",
          },
          {
            title: "文件大小",
            dataIndex: "size",
            key: "size",
            align: "right",
            render: (size) => {
              // size 为字节，按需求转换为 KB 或 MB
              if (size > 1024 * 1024) {
                return `${(size / 1024 / 1024).toFixed(2)} MB`;
              } else {
                return `${(size / 1024).toFixed(2)} KB`;
              }
            },
          },
          {
            title: "操作",
            align: "center",
            key: "action",
            render: (_, record) => (
              <div className="flex justify-center space-x-1">
                <div
                  className="text-primary cursor-pointer"
                  onClick={() => {
                    run(record);
                  }}
                >
                  依赖方
                </div>
              </div>
            ),
          },
        ]}
        pagination={false}
      />
    </Modal>
  );
};
