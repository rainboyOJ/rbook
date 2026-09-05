# 使用显式发布 profile 管理外部资产

文章与站点壳的核心发布默认为 `core` profile；图片编译、第三方工具页、论文资产和动画等环境相关步骤通过显式 profile（例如 `full`）加入。旧 `build.sh` 在过渡期调用完整 profile，以保持部署行为；核心文章验证不再被可选工具链的缺失阻塞。

## Status

accepted
