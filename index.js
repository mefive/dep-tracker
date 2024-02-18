import { argv } from "zx";
import "zx/globals";
import { JSDOM } from "jsdom";

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
      }
    }
  } else {
    console.log("No path provided");
  }
}

main();

export {};
