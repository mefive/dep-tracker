import axios from "axios";
import { DepNode } from "./types";

const PORT = 3000;

const domain = import.meta.env.DEV ? `http://localhost:${PORT}` : "";

export async function doParse(entry: string) {
  const res = await axios.post<{
    id: string;
  }>(`${domain}/api/parse`, { entry });

  return res.data.id;
}

export async function getChunks(id: string, max: number = 10000000) {
  const res = await axios.get<{
    chunks: DepNode[];
  }>(`${domain}/api/chunks/${id}?max=${max}`);

  return res.data.chunks;
}

export async function getDepChunks(id: string, chunkId: number) {
  const res = await axios.get<{
    chunks: DepNode[];
  }>(`${domain}/api/dep-chunks/${id}/${chunkId}`);

  return res.data.chunks;
}
