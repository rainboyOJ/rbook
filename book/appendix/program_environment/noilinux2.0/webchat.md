
### 微信的安装

方法1 : 安装

<%- video("rbook/webchat.mp4") %>

打开优麒麟应用商店官网，然后下载应用，就看到微信了 https://www.ubuntukylin.com/applications/106-cn.html 下载deb包，用命令`sudo dpkg -i` ，就能安装上了，而且可以用。 这是linux原生的，功能少点，但比wine的要轻巧不少。


```sh
wget  -O ~/weixin.deb "http://archive.ubuntukylin.com/software/pool/partner/weixin_2.1.1_amd64.deb"
sudo dpkg -i ~/weixin_2.1.1_amd64.deb
```


方法2 :  wine版微信



1.下载Wine环境包

```sh
wget http://archive.ubuntukylin.com/software/pool/partner/ukylin-wine_70.6.3.25_amd64.deb
```
 

2.下载微信（wine）包

```sh
wget http://archive.ubuntukylin.com/software/pool/partner/ukylin-wechat_3.0.0_amd64.deb
```
 

3.安装 win 环境包


```sh
dpkg -i  ./ukylin-wine_70.6.3.25_amd64.deb
```
 

4.使用 dpkg 安装 wechat 包

```sh
dpkg -i  ./ukylin-wechat_3.0.0_amd64.deb
```

默认情况下，微信会被安装到 `/opt/ukylin-wine/apps/wine-wechat` 目录下

 

5.运行 wechat

```sh
cd /opt/ukylin-wine/apps/wine-wechat/ && ./run.sh
```

