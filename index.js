import { argv } from "zx";
import "zx/globals";
import { JSDOM } from "jsdom";
import fs from "fs";

async function main() {
  if (argv.path != null) {
    // @ts-ignore
    const { path } = /** @type {{ path: string, baseDir: string }} */ (argv);

    const { stdout: outputPath } =
      await $`dep-tree entropy ${path} --no-browser-open`;

    // 使用 jsdom 解析 html
    const dom = await JSDOM.fromFile(outputPath.replace("\n", ""));

    // 获取 <script type="module">
    const script = dom.window.document.querySelector("script[type=module]");

    if (script?.textContent != null) {
      // 将 script 内部的 DATA 变量取出
      const matched = script.textContent.match(/const DATA = (\{.*?\})\n/s);

      if (matched != null) {
        const data = JSON.parse(matched[1]);
        console.log(data);
        // 将数据写入文件 simple.{timestamp}.json，使用 nodejs file system 模块
        const timestamp = new Date().getTime();
        const output = `simple.${timestamp}.json`;
        fs.writeFileSync(output, JSON.stringify(data, null, 2));
        console.log(`Output to ${output}`);
      }
    }
  } else {
    console.log("No path provided");
  }
}

main();

export {};
