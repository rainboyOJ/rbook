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

  /* 下载按钮：复用站点 .rbook-tool-button 的外观，浮在右下角工具按钮上方。
     站点自带的主题/全屏按钮固定在 bottom:20px，两个 36px 加 8px 间距占 80px，
     所以这里抬到 108px，刚好不遮住它们。 */
  .pdf-download-fab {
    position: fixed;
    right: 16px;
    bottom: 108px;
    z-index: 1001;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 12px;
    text-decoration: none;
  }

  .pdf-download-fab:hover {
    text-decoration: none;
  }

  /* 窄屏标题栏更高，需要多留 40px 才不出现外层滚动条 */
  @media (max-width: 768px) {
    .markdown-body > iframe.pdf-viewer {
      height: calc(100vh - 220px);
    }

    .pdf-download-fab {
      right: 10px;
      bottom: 100px;
    }
  }
</style>

<div class="pdf-download-wrap">
<a class="rbook-tool-button pdf-download-fab" href="/appendix/pre_contest_notes/比赛赛前注意事项.pdf" download="比赛赛前注意事项.pdf" title="下载 PDF（12 页，A4）"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 19h16"/></svg><span>下载 PDF</span></a>
</div>

<iframe
  class="pdf-viewer"
  src="/appendix/pre_contest_notes/比赛赛前注意事项.pdf"
  title="比赛赛前注意事项"
></iframe>
