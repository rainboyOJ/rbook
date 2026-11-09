# 线上 nginx 配置（rbook.roj.ac.cn）

这是服务器 `bohai:/www/server/panel/vhost/nginx/rbook.roj.ac.cn.conf` 的原样备份。
部署脚本不读这个文件，它只是让「线上到底怎么配的」在仓库里可查、可对比、可回滚。

改动线上配置后请同步更新本文件：`ssh bohai 'cat <路径>' > docs/nginx-rbook.roj.ac.cn.conf`

## `/papers/` 为什么这样配

目标是把 `assets/papers/` 变成一个可搜索、可排序、可切主题的文件列表，效果参照
[mohamnag/nginx-file-browser](https://github.com/mohamnag/nginx-file-browser)。

那份前端不能直接跑原生 `autoindex html`：它读的是页面里 `#idx-json` 节点内嵌的
**JSON 数组**，自己建表。所以 nginx 侧必须做三件事：

1. `autoindex_format json` —— 让 autoindex 吐 JSON 而不是 `<pre>` 列表；
2. `add_before_body` / `add_after_body` —— 把 `assets/autoindex/header.html` 与
   `footer.html` 包在 JSON 前后，`header.html` 里那段 JS 负责解析 JSON 建表；
3. `header_filter_by_lua_block` —— **把 Content-Type 改回 HTML**。

第 3 条是这个配置唯一的坑，也是它看起来绕的原因：

| 试过的写法 | 结果 |
| --- | --- |
| `autoindex_format json` + `add_*_body` | `Content-Type: application/json`，浏览器**不渲染 HTML**，直接显示源码 |
| 再加 `default_type text/html;` | 无效，仍是 `application/json` |
| 再加 `types { }` | 无效，仍是 `application/json` |
| `header_filter_by_lua_block` 覆盖 | ✅ 有效 |

`autoindex_format json` 在输出前就把类型定死了，`default_type` / `types` 都改不动它，
只能用 lua 在响应头阶段覆盖。本机 nginx 已编入 `lua_nginx_module`，所以可用。

覆盖时**必须加判据**，不能无条件改：

```lua
if ngx.header.content_type == "application/json" then
    ngx.header.content_type = "text/html; charset=utf-8"
end
```

因为同一个 `location` 也在服务 PDF 本身。无条件覆盖会把 `.pdf` 的
`application/pdf` 也改成 `text/html`——浏览器就不再用 PDF 阅读器打开，而是当网页
下载。这个 bug 我第一版就犯过，实测 `p429-yao.pdf` 返回 `text/html` + 386KB。

## 目录映射

```
URL  /papers/…
磁盘 /www/wwwroot/rbook.roj.ac.cn/assets/papers/…
```

`alias` 指向 `assets/papers/` 而不是独立的 `papers/`：PDF 源文件在仓库里就在
`assets/papers/`，`deploy.sh` 通过 rsync 整个 `dist/` 过去时会一并同步，
不需要额外一步。早期配置里 `alias` 写的是 `/www/wwwroot/rbook.roj.ac.cn/papers/`，
那个目录在服务器上根本不存在，所以一直 404。

## 校验方式

```bash
curl -sI https://rbook.roj.ac.cn/papers/          # 200 text/html
curl -sI https://rbook.roj.ac.cn/papers/p429-yao.pdf  # 200 application/pdf
curl -s  https://rbook.roj.ac.cn/papers/ | grep -o '"name":"[^"]*"'
```
