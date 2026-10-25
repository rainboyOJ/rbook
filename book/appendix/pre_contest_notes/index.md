<style>
  /* 正文默认 max-width: 672px（为散文阅读设计的栏宽），PDF 需要占满整个文章区 */
  .markdown-body:has(> iframe.pdf-viewer) {
    max-width: none;
  }

  /* iframe 的 height 属性只接受像素整数，写 height="100vh" 会被浏览器忽略并退化成
     100px。视口单位必须放在 CSS 里。180px = 顶部导航 + 标题栏 + 底部留白，
     桌面端刚好占满剩余视口且不产生外层滚动条。 */
  .markdown-body > iframe.pdf-viewer {
    display: block;
    width: 100%;
    height: calc(100vh - 180px);
    border: none;
  }

  /* 窄屏标题栏更高，需要多留 40px 才不出现外层滚动条 */
  @media (max-width: 768px) {
    .markdown-body > iframe.pdf-viewer {
      height: calc(100vh - 220px);
    }
  }
</style>

<iframe
  class="pdf-viewer"
  src="/appendix/pre_contest_notes/比赛赛前注意事项.pdf"
  title="比赛赛前注意事项"
></iframe>
