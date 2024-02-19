import { Button, Form, Input, Table, message } from "antd";
import "./App.css";
import * as api from "./api";
import { useCallback, useEffect, useRef, useState } from "react";
import { AxiosError } from "axios";
import { DepNode } from "./types";
import _ from "lodash";

function App() {
  const [id, setId] = useState<string | null>(null);
  const [chunks, setChunks] = useState<DepNode[]>([]);

  const isParsingRef = useRef(false);
  const parsingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [form] = Form.useForm<{
    entry: string;
  }>();

  const loadChunks = useCallback(async (id: string) => {
    if (id == null) {
      return;
    }

    try {
      setChunks(await api.getChunks(id));
      parsingTimerRef.current = null;
      isParsingRef.current = false;
    } catch (e) {
      parsingTimerRef.current = setTimeout(() => loadChunks(id), 1000);
    }
  }, []);

  useEffect(() => {
    if (id != null) {
      loadChunks(id);
    }
  }, [id, loadChunks]);

  useEffect(() => {
    return () => {
      if (parsingTimerRef.current) clearTimeout(parsingTimerRef.current);
    };
  }, []);

  return (
    <>
      <h1>Dep Tracker</h1>

      <Form form={form} className="flex space-x-1">
        <Form.Item
          name="entry"
          rules={[
            {
              required: true,
              message: "请输入入口路径",
            },
          ]}
          className="flex-1"
        >
          <Input placeholder="输入入口路径" size="large" className="w-full" />
        </Form.Item>

        <Button
          type="primary"
          size="large"
          onClick={async () => {
            if (isParsingRef.current) {
              clearTimeout(parsingTimerRef.current!);
              parsingTimerRef.current = null;
              isParsingRef.current = false;
              return;
            }

            const values = await form.validateFields();

            try {
              const id = await api.doParse(values.entry);
              isParsingRef.current = true;
              setId(id);
            } catch (e) {
              if (e instanceof AxiosError) {
                message.error(e.response?.data ?? e.message);
              }
            }
          }}
        >
          {isParsingRef.current ? "取消分析" : "分析"}
        </Button>
      </Form>

      <div className="mt-1">
        {!_.isEmpty(chunks) && !isParsingRef.current && (
          <div className="mb-1">总计: {chunks.length} 个</div>
        )}

        <Table
          dataSource={chunks}
          loading={isParsingRef.current}
          rowKey="id"
          pagination={false}
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
          ]}
        />
      </div>
    </>
  );
}

export default App;
