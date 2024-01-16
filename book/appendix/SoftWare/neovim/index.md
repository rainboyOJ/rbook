## Neovim 简介

Neovim是一个文本编辑器，是Vim（Vi Improved）的一个分支。它在Vim的基础上进行了扩展和改进，旨在提供更强大、更灵活的编辑体验。以下是Neovim的一些主要特点和优势：

- [官网](https://neovim.io/) https://neovim.io/
- [github仓库](https://github.com/neovim/neovim) https://github.com/neovim/neovim

Neovim简介

1. 现代化架构

Neovim的架构更加现代化，它采用了异步插件架构，允许插件以非阻塞的方式运行，提高了编辑器的性能和响应速度。

2. 插件支持

Neovim支持大量的插件，这些插件可以通过包管理器（如vim-plug、dein.vim等）方便地安装和管理。这使得用户可以根据自己的需求定制编辑器，添加各种功能和工具。

3. 内置终端模式

Neovim内置了终端模式，可以直接在编辑器中运行和交互命令行。这样用户可以在编辑器内完成大部分任务，无需切换到终端。

4. Lua编程接口

Neovim使用Lua作为其插件和配置脚本的主要编程语言。这使得用户可以使用Lua来定制和扩展Neovim，提供更灵活的配置选项。

5. 远程插件

Neovim支持远程插件，允许将编辑器的功能扩展到远程服务器上。这对于开发和远程协作非常有用。

6. 易于扩展

Neovim的设计使得它非常容易扩展和定制。用户可以通过配置文件或插件自定义编辑器的外观和行为，使其适应个人喜好。

7. 持续的开发

Neovim是一个活跃的开源项目，不断有新的功能和改进被引入。用户可以从社区的贡献中受益，保持编辑器的现代性和前沿性。

## Neovim 安装 

安装Neovim

```bash
sudo apt install nodejs python3
```

在ubutnu上安装最稳定版本的Neovim：

```bash
sudo add-apt-repository ppa:neovim-ppa/stable
sudo apt update
sudo apt install neovim
```

在ubutnu上安装`unstable`但是最新版本的Neovim：

```
sudo add-apt-repository ppa:neovim-ppa/unstable
sudo apt update
sudo apt install neovim
```

## Neovim 配置

最简单的配置方式就是使用[lazyvim](https://www.lazyvim.org/)


先安装相关依赖

然后按照[官网的安装方式](https://www.lazyvim.org/installation)来安装就可以了