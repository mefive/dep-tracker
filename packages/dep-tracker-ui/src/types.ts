export interface DepNode {
  /** 节点 id */
  id: number;
  /** 文件名 */
  fileName: string;
  /** 组名 */
  group: string;
  /** 目录名 */
  dirName: string;
  /** 行数 */
  loc: number;
  /** 文件大小 单位字节 */
  size: number;
  /** 是否是目录 */
  isDir: boolean;
}
