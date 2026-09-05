
[[toc]]

## pure-ftpd的使用
在竞赛的平常学习中,总是需要学生把文件传给老师,或者老师下发文件,这人时候需要一种简单的局域网内的传输文件的方式,经过我尝试了多种方式后,使用ftp是最简单的方式,这里选择`pure-ftpd`,因为它的配置与安装比较简单

## ubuntu下安装


```bash
sudo apt install pure-ftpd
```

然后,查看是否已经运行

```bash
ps -ef |grep pure-ftpd |grep -v grep
systemctl status pure-ftpd
```
现在已经可以使用了,配合 FileZilla


## 如何配置匿名用户只可以上传到某个文件夹?

在ubuntu下,先停止`pure-ftpd`服务

```bash
sudo systemctl stop pure-ftpd.service
sudo systemctl disable pure-ftpd.service
```

创建一个ftp用户

```bash
sudo useradd -m ftp
```

手动启动`pure-ftp`

```bash
sudo pure-ftpd -e -M
```

参数解释

- `-e` : Only allow anonymous users. Use this on a public FTP site with no
remote FTP access to real accounts.
- `-M`: Allow anonymous users to create directories.
- `--with-language=simplified-chinese` 使用中文

## 非root权限运行

用root权限运行,学生上传的文件都在`/home/ftp`下(这当然可以改了),

在这个模式下,监听在端口`2121`

```
FTP_ANON_DIR=<YOUR_PATH> pure-ftpd --with-nonroot -e -M
```
