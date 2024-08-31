"==================================== vim 最小配置 ===================================
"=== 版本: bate 1.0
"=== 描述: Rainboy写给学生参加NOIP使用的VIM配置文件
"=== 特点:  - 极小
"           - 不使用插件
"           - 最简原则
"安装 curl -o ~/.vimrc https://gitee.com/Rainboy/sample-vim-config/raw/master/vimrc
"=====================================================================================


"====================================== 外观设定 =====================================
syntax enable
syntax on                       " 开启代码高亮
set background=dark             " set bg=dark 
colorscheme murphy              " 设定主题
set cmdheight=2                 " 设定cmd的高度
set number                      " 开启行号
set relativenumber              " 开启相对行号

set tabstop=4                   " 设置 tab的宽度
set expandtab                   " 空格代替tab
set autoindent                  " 自动缩进
set smartindent                 " 智能缩进,能识别{ }
set cindent                     " 开启C语言缩进模式
set shiftwidth=4                " 设置格式化时制表符所占用的空格
set softtabstop=4               " 让vim把连续数量的制表看成空格
set copyindent                  " 复制的时候 缩进

set cursorline                  " 高亮当前行
"set cursorcolumn                " 高亮当前列
set ruler                       " 显示光标当前的位置,逗号分隔
set list                        " 显示特殊字符
set listchars=tab:\~\ ,trail:.  " 设定tab用~表示,行尾空白用.

set laststatus=2                " 启动显示状态行(1),总是显示状态行(2) 

"====================================== 行为设定 =====================================
filetype on                     "开启文件类型侦测
set history=1000                "记录的最大cmd历史
set nocompatible                "关闭vi兼容
set backspace=indent,eol,start  "使用 退格键 来删除
set whichwrap=<,>,[,],h,l       " 光标在行尾,行首移动 

set autowrite                   " 文件一有写入,自动保存
set autoread                    " 文件改变时,自动载入
set nobackup                    " 不使用备份文件
set noswapfile                  " 不使用交换文件
set showcmd                     " 显示输入的命令
"set showmatch                   " 在输入括号时光标会短暂地跳到与之相匹配的括号处，不影响输入

set nohls                       " 不高亮搜索
set incsearch                   " 实时搜索
set novisualbell                " 不使用 visualbell
set vb t_vb=

set fileencodings=utf-8         " 设定文件的编码
set fileformat=unix             " 设定文件的格式

"快捷键
imap <c-l> <esc>A
imap <c-h> <esc>I
"括号自动补全
inoremap ( ()<esc>i
inoremap { {}<esc>i
inoremap [ []<esc>i
inoremap " ""<esc>i
inoremap ' ''<esc>i

