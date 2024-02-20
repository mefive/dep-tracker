import { argv } from "zx";
import "zx/globals";
import { JSDOM } from "jsdom";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

/**
 * @typedef {object} DepNode
 * @property {number} id - 节点 id
 * @property {string} fileName - 文件名
 * @property {string} group - 组名
 * @property {string} dirName - 目录名
 * @property {number} loc - 行数
 * @property {number} size - 文件大小 一个比例值，如 0 1 2 3
 * @property {boolean} isDir - 是否是目录
 */

/**
 * @typedef {object} DepLink
 * @property {number} from - 起始节点 id
 * @property {number} to - 终止节点 id
 * @property {boolean} isDir - 是否是目录
 * @property {boolean} isCyclic - 是否是循环依赖
 */

/**
 * 解析 dep-tree entropy 输出的 html 文件
 * @param {string} entry - 入口文件相对路径
 * @returns {string | undefined} - 返回解析后的数据文件的 id
 */
export function parse(entry) {
  if (entry != null) {
    const id = uuidv4().replace(/-/g, "");

    parseAsync(entry, id);

    return id;
  } else {
    throw new Error("No path provided");
  }
}

/**
 * 解析 dep-tree entropy 输出的 html 文件
 * @param {string} entry
 * @param {string} id
 * @returns void
 */
async function parseAsync(entry, id) {
  const { stdout: outputPath } =
    await $`dep-tree entropy ${entry} --no-browser-open`;

  // 使用 jsdom 解析 html
  const dom = await JSDOM.fromFile(outputPath.replace("\n", ""));

  // 获取 <script type="module">
  const script = dom.window.document.querySelector("script[type=module]");

  if (script?.textContent != null) {
    // 将 script 内部的 DATA 变量取出
    const matched = script.textContent.match(/const DATA = (\{.*?\})\n/s);

    if (matched != null) {
      /**
       * @type {{ nodes: DepNode[] }}
       */
      const data = JSON.parse(matched[1]);

      // 如果没有 database 文件夹，创建一个
      if (!fs.existsSync("database")) {
        fs.mkdirSync("database");
      }

      const output = `database/${id}.json`;

      // 修正文件的 size，使用 file system 获取文件大小
      for (const node of data.nodes) {
        if (!node.isDir) {
          const rootDir = findRootDir(entry);
          const path = `${rootDir}/${node.dirName}/${node.fileName}`;

          const stats = fs.statSync(path);
          node.size = stats.size;
        }
      }

      // 将数据写入文件 {id}.json，使用 nodejs file system 模块
      fs.writeFileSync(output, JSON.stringify(data, null, 2));

      console.log(`Output to ${output}`);

      return id;
    }
  }
}

/**
 * 函数用于递归查找包含 package.json 的目录
 * @param {string} dir
 * @returns {string} - 返回包含 package.json 的目录
 */
function findRootDir(dir) {
  // 检查当前目录下是否有 package.json 文件
  if (fs.existsSync(path.join(dir, "package.json"))) {
    return dir; // 找到了，返回这个目录
  }

  // 获取上一级目录
  const parentDir = path.dirname(dir);

  // 如果已经到了根目录还没找到，则停止查找
  if (parentDir === dir) {
    throw new Error("package.json not found in any parent directory");
  }

  // 否则，递归查找上一级目录
  return findRootDir(parentDir);
}

/**
 * 获取 size 最大的前 max 个节点
 * @param {string} id
 * @param {number} max
 * @returns {DepNode[]}
 */
export function getLargestChunks(id, max = 10) {
  const data = fs.readFileSync(`database/${id}.json`, "utf-8");

  /**
   * @type {{ nodes: DepNode[] }}
   */
  const parsed = JSON.parse(data);

  // 获取 loc 最大的前 max 个节点
  const largest = parsed.nodes
    .filter((node) => !node.isDir)
    .sort((a, b) => b.size - a.size)
    .slice(0, max);

  return largest;
}

/**
 * 获取某个 chunk 的依赖方，即 to 是这个 chunk 的 chunks {NodeDep[]}
 * @param {string} id
 * @param {number} chunkId
 * @returns {DepNode[]}
 */
export function getDepChunks(id, chunkId) {
  const data = fs.readFileSync(`database/${id}.json`, "utf-8");

  /**
   * @type {{ nodes: DepNode[], links: DepLink[] }}
   */
  const parsed = JSON.parse(data);

  const deps = parsed.links
    .filter((link) => link.to === chunkId && !link.isDir)
    .map(
      (link) =>
        /** @type{DepNode} */ (
          parsed.nodes.find((node) => node.id === link.from)
        ),
    );

  return deps;
}
