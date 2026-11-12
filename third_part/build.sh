# 执行这个脚本,可以编译本目录下的所有的文件,并生成到 dist 目录

# brain_net_map
cd ./third_part/brain_net_map/
bash ./build.sh
cd ../../

# 清理已移除的旧关系图页面
rm -rf ./dist/brain_map_dagre

# code_template
cd ./third_part/code_template_filter/
bash build.sh
cd ../../

# rsync canvas 动画
rsync -avP ./third_part/canvas ./dist/

