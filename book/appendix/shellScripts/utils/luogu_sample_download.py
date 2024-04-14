#!/usr/bin/env python3
import sys
import re
import urllib.parse
import json
import requests

pid = sys.argv[1]

# check pid if null
if pid is None:
    pid=input("请输入题号:")


# check pid if number use by regex
if re.match(r'^\d+$', pid):
    pid = "P" + pid

# download
# print(pid)
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'
}
url = f"https://www.luogu.com.cn/problem/{pid}"
# print(url)
response = requests.get(url,headers=headers)

# check response status if 200
if response.status_code != 200:
    print(f"请求失败,状态码:{response.status_code}")
    exit()


html = response.content.decode('utf-8')


# 正则提取字符串
dataReg = re.compile(r'decodeURIComponent\("([\s\S]+?)"\)')
data_string = dataReg.findall(html)[0]
data = json.loads(urllib.parse.unquote(data_string,encoding='utf-8'))
samples=data["currentData"]["problem"]["samples"]

# 创建文件
cnt=0
print("开始下载数目>>> %s <<< 数据:" % data["currentTitle"])
for input,output in samples:
    cnt+=1
    input_name="in"
    output_name="out"
    if cnt > 1:
        input_name+=str(cnt)
        output_name+=str(cnt)

    print("创建输出文件 : %s,输出文件 %s" % (input_name,output_name))
    
    with open(input_name, "w") as f:
        f.write(input)
    with open(output_name, "w") as f:
        f.write(output)