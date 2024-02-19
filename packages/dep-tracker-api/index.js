/**
 * @module dep-tracker-api
 * @description
 * 使用 express 框架搭建的后端服务，用于提供 dep-tracker 的 api
 */

import express from "express";
import { getLargestChunks, parse } from "./dep-parser.js";
import cors from "cors";

// 从 ENV 变量中获取端口号，如果没有则使用 3000
const port = process.env.PORT || 3000;

const app = express();

app.use(express.json());

// 配置跨域访问，使用 cors 中间件
app.use(cors());

app.post("/api/parse", (req, res) => {
  const { entry } = req.body;
  const id = parse(entry);
  res.json({ id });
});

app.get("/api/chunks/:id", (req, res) => {
  const { id } = req.params;
  const max = req.query.max;
  const chunks = getLargestChunks(id, Number(max));
  res.json({ chunks });
});

// 全局捕获异常，返回 500，以及错误信息 message
app.use((err, _req, res, _next) => {
  res.status(500).send(err.message);
});

app.listen(port, () => {
  console.log("Server is running on port 3000");
});
