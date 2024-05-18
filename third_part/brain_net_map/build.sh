# 切换到 b.sh 所在目录
npx vite build -c ./vite.config.js --base brain_net_map
/usr/bin/rm -rf ../../dist/brain_net_map
mv ./dist/ ../../dist/brain_net_map
