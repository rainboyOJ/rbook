
[[toc]]

## 前言

[isolate](https://github.com/ioi/isolate) 是一个用来**安全运行不可信程序的沙箱**(sandbox),由纯 C 写成,非常轻量。

它最早是为 IOI(国际信息学奥林匹克)以及类似的算法竞赛开发的,现在是各大 OJ / 比赛系统(比如 CMS)底层最常用的评测执行引擎之一。我们在洛谷、Codeforces 上交的代码,就是被这样的沙箱"关起来"运行的:

- 选手提交的代码是**不可信**的:可能死循环、可能吃光内存、甚至可能故意破坏评测机。评测机不能直接在主机上跑它们。
- 比赛题目有严格的时空限制(如 1 秒、256 MB),需要**非常精准**地统计 CPU 时间和内存峰值。

isolate 底层利用了 Linux 内核的几个高级特性:

- **Namespaces(命名空间)**:让程序只能"看见"一个被限制的目录、没有网络、看不到其他进程;
- **Cgroups(控制组)**:精确限制和统计内存、CPU 等资源;
- **Seccomp**:禁用少数可能被用来在沙箱之间传递信息的系统调用。

如果你要自己做一个"在线编译运行别人代码"的系统(校内 OJ、练习评测机),isolate 是目前最成熟、最值得直接用的底层沙箱。

## 安装

isolate 只能跑在 Linux 上。有两种装法:**源码编译**(通用,而且编译只要十几秒)和 **APT 仓库**(仅 Debian / Ubuntu)。

### 方法一:源码编译(推荐)

**1. 安装依赖**

```bash
sudo apt-get update
sudo apt-get install git build-essential pkg-config libcap-dev libseccomp-dev libsystemd-dev
```

其中 `libsystemd-dev` 是编译 `isolate-cg-keeper` 用的;只想编译 `isolate` 本体也可以先不装。

**2. 拉源码并编译**

```bash
git clone https://github.com/ioi/isolate.git
cd isolate
make isolate
```

当前目录下就生成了 `isolate` 这个可执行文件。如果要顺便生成 man 手册,需要 `asciidoc`,直接 `make` 即可。

**3. 安装到系统(可选)**

```bash
sudo make install
```

这一步会:

- 把 `isolate` 装到 `/usr/local/bin`,并且**自动设成 setuid root**(isolate 需要高权限才能创建沙箱,沙箱内的程序再降权运行);
- 生成配置文件 `/usr/local/etc/isolate.cf`;
- 创建沙箱根目录 `/var/local/lib/isolate`。

### 方法二:APT 仓库(仅 Debian / Ubuntu)

创建 `/etc/apt/sources.list.d/isolate.sources`,内容:

```plaintext
Types: deb
URIs: http://www.ucw.cz/isolate/debian/
Suites: trixie-isolate
Components: main
Architectures: amd64
Signed-By: /etc/apt/keyrings/isolate.asc
```

下载仓库公钥:

```bash
sudo mkdir -p /etc/apt/keyrings
sudo curl https://www.ucw.cz/isolate/debian/signing-key.asc > /etc/apt/keyrings/isolate.asc
```

然后更新并安装:

```bash
sudo apt update
sudo apt install isolate
```

### 验证安装

初始化一个测试沙箱:

```bash
isolate --init
```

如果配置正确,终端会输出沙箱的工作目录(默认是 `/var/local/lib/isolate/0/box`)。测试完清理掉:

```bash
isolate --cleanup
```

## 基本使用

标准流程就四步:**初始化沙箱 → 放入程序 → 受限运行 → 清理沙箱**。

### 1. 初始化沙箱

```bash
isolate --init
```

输出沙箱目录路径,比如 `/var/local/lib/isolate/0/box`。这个 `box` 目录就是沙箱的"世界":沙箱内的程序只能看到这个目录下的文件,把它当成自己的 `/`。

### 2. 把程序放进沙箱

假设已经编译好了可执行文件 `program`(C++ 编译出的二进制、Python 脚本等),复制进去,输入数据一般也放这里:

```bash
cp ./program /var/local/lib/isolate/0/box/
cp ./input.txt /var/local/lib/isolate/0/box/
```

### 3. 受限运行

`--run --` 后面的部分才是沙箱内真正执行的命令,路径相对于 `box` 目录:

```bash
isolate --run -- ./program
```

加上资源限制就长这样:

```bash
isolate \
  --time=1.0 \
  --wall-time=1.5 \
  --mem=256000 \
  --run -- ./program
```

运行结束后,`isolate` 会在**标准错误**输出一行状态,比如:

```text
OK (0.052 sec real, 0.053 sec wall)
TO: Time limit exceeded
RE: Exited with error status 1
SG: Caught fatal signal 11
```

### 4. 清理沙箱

```bash
isolate --cleanup
```

销毁环境、删除 `box` 里的临时文件(已经清理过的话什么都不做)。**每评测一个提交,都应该 init 一次、cleanup 一次**,避免上一个选手的文件残留。

## 常用限制参数

| 参数 | 含义 |
| --- | --- |
| `--time=1.0` | CPU 时间上限 1.0 秒(不计被别人抢走 CPU 的时间),超时杀掉程序 |
| `--wall-time=1.5` | 墙上时钟(真实物理时间)上限 1.5 秒,防止程序用 `sleep` 挂机,一般设成 `--time` 的 1.5~2 倍 |
| `--extra-time` | 超时后宽限几秒再杀,用来测出"到底超了多少" |
| `--mem=256000` | 地址空间上限 256000 KB(约 250 MB) |
| `--cg-mem=256000` | (需 `--cg`)整个控制组的总内存上限,统计更准,评测机一般用这个 |
| `--stack=size` | 栈大小上限(KB),默认整个地址空间都可以给栈 |
| `--processes` / `--processes=n` | 允许创建的进程 / 线程数,**默认只允许 1 个** |
| `--open-files=n` | 打开文件数上限,默认 1024 |
| `--fsize=size` | 单个文件大小上限(KB),防止写爆磁盘 |
| `--box-id=n` | 沙箱编号,并行评测多个提交时每人一个号(0, 1, 2, …) |
| `--meta=file` | 把运行报告写到文件里(见下) |
| `--share-net` | 放开网络(默认**完全断网**) |

几点提醒:

- **网络默认是关的**:isolate 给程序单独的网络命名空间,里面没有任何网卡,程序没法对外发一个字节。这是默认行为,什么都不用配。
- **多进程必须开 cgroups**:Python、Java 这类会起多个线程 / 进程的语言,记得用 `--cg` 并放开 `--processes`,否则时间、内存限制会失效。
- 需要精确的内存统计(而不是只限制地址空间)时,用 `--cg --cg-mem=...`。

## 输入输出与运行报告(meta 文件)

评测系统不仅要跑程序,还要喂输入、收输出、统计资源占用。用重定向参数即可:

```bash
isolate \
  --meta=result.txt \
  --stdin=input.txt \
  --stdout=output.txt \
  --stderr=error.txt \
  --run -- ./program
```

- `--stdin` / `--stdout` / `--stderr`:把外面的测试数据喂给程序,把输出写回外面的文件;
- `--meta=result.txt`:在**外面**生成一份运行报告,格式是 `键:值` 一行一条,常见的有:

| 键 | 含义 |
| --- | --- |
| `time` | CPU 时间(秒) |
| `time-wall` | 真实运行时间(秒) |
| `max-rss` | 内存峰值(KB) |
| `cg-mem` | (开了 `--cg`)控制组总内存峰值(KB) |
| `exitcode` | 程序正常退出时的退出码 |
| `exitsig` | 程序被哪个信号杀死(如段错误是 11) |
| `status` | 状态码:`RE` 非零退出 / `SG` 死于信号 / `TO` 超时 / `XX` 沙箱内部错误(正常结束时**没有**这一项) |
| `message` | 给人看的状态说明,如 `Time limit exceeded.` |
| `killed` | 程序是被沙箱杀掉的(如超时) |
| `cg-oom-killed` | 被 OOM killer 杀掉(内存超限) |

评测程序只要解析这个文件,就能判定 **AC / TLE / MLE / RE** 等结果了。

## 使用 cgroups 模式(--cg)

如果要限制**多进程 / 多线程**程序,或者要精确统计内存,就要开 cgroups 模式:`--init`、`--run`、`--cleanup` 三条命令都要带 `--cg`:

```bash
isolate --cg --init
isolate --cg --cg-mem=256000 --time=1.0 --processes --run -- ./program
isolate --cg --cleanup
```

注意:

- 现在的 isolate 要求 **cgroup v2**(新发行版默认就是);
- 如果系统用 systemd,要先启用源码里 `systemd/` 目录下的 `isolate.service`,它会建立一个委托给 isolate 的 cgroup 子树(`sudo systemctl enable --now isolate`);
- 在容器里跑 isolate 一般不推荐,容器管理器通常不会正确委托 cgroups,而且容器里的邻居会干扰计时。

## 并行评测:--box-id

默认沙箱 ID 是 0。要同时评测多个提交,给每个实例一个独立的 ID:

```bash
isolate --box-id=0 --init
isolate --box-id=1 --init
```

对应的 `box` 目录分别是 `/var/local/lib/isolate/0/box` 和 `/var/local/lib/isolate/1/box`。每个 ID 用独立的非 root 用户跑程序,互不可见;用完各自 `--cleanup`。

## 小结

- isolate = **Linux namespaces + cgroups + seccomp** 做出来的评测沙箱,IOI 系比赛系统都在用;
- 流程固定四步:`--init` → 拷文件进 `box` → `--run -- 命令` → `--cleanup`;
- `--time` / `--wall-time` / `--mem` 控时空,`--meta` 拿结果,网络默认断开;
- 多进程程序记得 `--cg`,并行评测记得 `--box-id`。

## 参考

- GitHub 仓库: <https://github.com/ioi/isolate>
- 手册页(man page): <http://www.ucw.cz/isolate/isolate.1.html>
- 设计论文: [Isolate's design](https://mj.ucw.cz/papers/isolate.pdf) 、[grading system security](https://mj.ucw.cz/papers/secgrad.pdf)
