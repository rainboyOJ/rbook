# Noto Serif SC 正文字体

来源：[@fontsource/noto-serif-sc 5.3.1](https://www.npmjs.com/package/@fontsource/noto-serif-sc/v/5.3.1)，上游 [Noto CJK](https://github.com/notofonts/noto-cjk)。许可为随附的 [SIL Open Font License 1.1](./LICENSE)。

仅保留常规 400 字重的 WOFF2：101 个 Unicode 分包，共 3,182,532 字节。`400.css` 保留上游完整字符范围，使用相对路径和 `font-display: swap`；浏览器根据文章中的字符按需请求，不预加载全部字体。标题、强调和代码分别使用系统黑体、系统等宽字体。

在仓库根目录执行 `python3 scripts/vendor-noto-serif.py`，可以重新下载固定版本并生成相同资产。脚本校验固定的 npm tarball SHA-512；`manifest.json` 记录来源、版本及每个分包的 SHA-256。构建只使用已提交的文件，不需要下载字体或安装 Fontsource 包。

字体不可用时，回退到设备宋体，再回退到浏览器衬线字体；上游字符集之外的字符由系统字体补足。字体样式表由文章模板引用，Vite 将此目录作为 public 资源复制到发布目录。
