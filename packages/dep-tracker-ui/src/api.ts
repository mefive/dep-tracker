import axios from "axios";
import { DepNode } from "./types";

const PORT = 3000;

export async function doParse(entry: string) {
  const res = await axios.post<{
    id: string;
  }>(`http://localhost:${PORT}/api/parse`, { entry });

  return res.data.id;
}

export async function getChunks(id: string, max: number = 10000000) {
  const res = await axios.get<{
    chunks: DepNode[];
  }>(`http://localhost:${PORT}/api/chunks/${id}?max=${max}`);

  return res.data.chunks;
}
