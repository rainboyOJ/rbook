
[[toc]]

## 前言

安装gdb
cgdb就是一个带了curses 界面的gdb前端,比直接使用gdb好用一点点

noilinux 2.0 就是 ubuntu 20.04 ,ubuntu 20.04 下面的cgdb版本为0.6,有bug,所以这里我们手动编译安装cgdb 0.8

## 安装过程

### 安装依赖的包
```
sudo apt-get install -y libncurses5-dev flex bison texinfo libreadline-dev automake autotools-dev
```
```
ghproxy="https://mirror.ghproxy.com"
git clone -b v0.8.0 $ghproxy/https://github.com/cgdb/cgdb
```
### 编译安装
```
cd cgdb
./autogen.sh
./configure
make
sudo make install
```

### 配置

```
mkdir -p ~/.cgdb
cat << EOF > ~/.cgdb/cgdbrc
set winsplitorientation=vertical
EOF
```

上面的配置是使CGDB左边显示代码,右边显示调试界面


### 运行

```
cgdb -q 1
```

## 怎么使用

## 参考

- [1] : https://blog.csdn.net/Leezed525/article/details/124728458
