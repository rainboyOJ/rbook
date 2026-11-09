# 线上 nginx 配置（rbook.roj.ac.cn）

这是服务器 `bohai:/www/server/panel/vhost/nginx/rbook.roj.ac.cn.conf` 的原样备份。
部署脚本不读这个文件，它只是让「线上到底怎么配的」在仓库里可查、可对比、可回滚。

改动线上配置后请同步更新本文件：`ssh bohai 'cat <路径>' > docs/nginx-rbook.roj.ac.cn.conf`

## 存在哪里：extension 目录，不是主配置

这段 location 的实际落点是：

```
/www/server/panel/vhost/nginx/extension/rbook.roj.ac.cn/papers.conf
        ↑ 主配置第 13 行 include，宝塔面板不碰这个目录
```

**为什么不直接写在主 vhost 配置里**：主配置
`/www/server/panel/vhost/nginx/rbook.roj.ac.cn.conf` 由宝塔面板托管。在面板里改
「伪静态」、或在站点设置里点保存，都会重写它，手加的 location 就丢了。extension
目录被主配置 include（第 13 行），但面板不管理它，所以放这里才稳定。

仓库里的源头是 `deploy/nginx/papers.conf`，由 `scripts/install-nginx-papers.sh`
装到服务器。`deploy.sh` 在 rsync 之后调用这个脚本。

脚本的行为：

- **幂等**：远端内容与仓库一致就不写文件、不 reload。
- **先备份**：不一致时把旧文件存成 `papers.conf.bak.<时间戳>`。
- **写完必 `nginx -t`**：语法错就自动回滚（有备份用备份，没备份就删掉），
  绝不让坏配置留在服务器上。
- **失败不阻断发布**：配置问题只打警告，`deploy.sh` 继续跑完。

注意：`nginx -t` 会把「重复 location」判为错误（`duplicate location "/papers"`）。
所以主配置里**不能**再留一份 `/papers/` 的 location，否则每次部署都会撞上。
迁移时已把主配置里那段删掉，只留一行注释指向 extension。

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
