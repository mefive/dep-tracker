import fs from "fs";
import { JSDOM } from "jsdom";
import { v4 as uuidv4 } from "uuid";
import "zx/globals";
import _ from "lodash";

/**
 * @typedef {object} DepNode
 * @property {number} id - 节点 id
 * @property {string} fileName - 文件名
 * @property {string} group - 组名
 * @property {string} dirName - 目录名
 * @property {number} loc - 行数
 * @property {number} size - 文件大小 一个比例值，如 0 1 2 3
 * @property {boolean} isDir - 是否是目录
 * @property {number} depth - 深度
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
    // 检查入口文件是否是 js jsx ts tsx 文件
    if (!/\.(j|t)sx?$/.test(entry)) {
      throw new Error("入口文件不是 js jsx ts tsx 文件");
    }

    // 检查入口文件是否存在
    if (!fs.existsSync(entry) || !fs.statSync(entry).isFile()) {
      throw new Error("入口不存在或不是文件");
    }

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
    await $`npx dep-tree entropy ${entry} --no-browser-open`;

  // 使用 jsdom 解析 html
  const dom = await JSDOM.fromFile(outputPath.replace("\n", ""));

  // 获取 <script type="module">
  const script = dom.window.document.querySelector("script[type=module]");

  if (script?.textContent != null) {
    // 将 script 内部的 DATA 变量取出
    const matched = script.textContent.match(/const DATA = (\{.*?\})\n/s);

    if (matched != null) {
      /**
       * @type {{ nodes: DepNode[], links: DepLink[] }}
       */
      const rawData = JSON.parse(matched[1]);

      // 如果没有 database 文件夹，创建一个
      if (!fs.existsSync("database")) {
        fs.mkdirSync("database");
      }

      const output = `database/${id}.json`;

      const rootDir = findRootDir(entry);

      // 修正文件的 size，使用 file system 获取文件大小
      for (const node of rawData.nodes) {
        if (!node.isDir) {
          const path = `${rootDir}/${node.dirName}${node.fileName}`;

          const stats = fs.statSync(path);
          node.size = stats.size;
        }
      }

      /**
       * @type {{ nodes: Record<string, DepNode>, links: DepLink[] }}
       */
      const data = {
        nodes: _.mapKeys(rawData.nodes, (node) => node.id),
        links: rawData.links,
      };

      // 找到 root node
      const rootNode = rawData.nodes.find(
        (node) => entry === `${rootDir}/${node.dirName}${node.fileName}`,
      );

      if (rootNode != null) {
        addDepth(rootNode.id, 0, data.nodes, data.links);
      }

      // 将数据写入文件 {id}.json，使用 nodejs file system 模块
      fs.writeFileSync(output, JSON.stringify(data, null, 2));

      console.log(`Output to ${output}`);

      return id;
    }
  }
}

/**
 * 为 node 添加 depth 字段
 * @param {number} nodeId
 * @param {number} depth
 * @param {Record<string, DepNode>} nodes
 * @param {DepLink[]} links
 * @returns void
 */
export function addDepth(nodeId, depth, nodes, links) {
  const node = nodes[nodeId];

  if (node.depth != null) {
    return;
  }

  node.depth = depth;

  const deps = links.filter((link) => link.from === nodeId && !link.isDir);

  deps.forEach((dep) => {
    addDepth(dep.to, depth + 1, nodes, links);
  });
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
   * @type {{ nodes: Record<string, DepNode>, links: DepLink[] }}
   */
  const parsed = JSON.parse(data);

  // 获取 loc 最大的前 max 个节点
  const largest = Object.entries(parsed.nodes)
    .map(([__, node]) => node)
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
   * @type {{ nodes: Record<string, DepNode>, links: DepLink[] }}
   */
  const parsed = JSON.parse(data);

  const deps = parsed.links
    .filter((link) => link.to === chunkId && !link.isDir)
    .map((link) => parsed.nodes[link.from]);

  return deps;
}
