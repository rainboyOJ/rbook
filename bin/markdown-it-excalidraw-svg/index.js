// image_extension_plugin.js
const fs = require('fs');
const Path = require("path")

function imageExtensionPlugin(md, options = {}) {
    // 保存默认的 image 渲染器规则
    // 如果原始规则不存在，则提供一个默认的回退函数
    const defaultImageRenderer = md.renderer.rules.image || function(tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };

    // 重写 image 渲染器规则
    md.renderer.rules.image = function(tokens, idx, options, env, self) {
        const token = tokens[idx];

        // 从 token 中获取 'src' 属性
        // attrGet 是 markdown-it token 的一个辅助方法
        const src = token.attrGet('src');

        // 如果 src 不存在，直接使用默认渲染器
        if (!src) {
            return defaultImageRenderer(tokens, idx, options, env, self);
        }

        // 使用 .split('.').pop() 是一种简单且在浏览器/Node.js中都可用的方法
        const extensions = src.split('.').map( str =>str.toLowerCase())
        const ext_last_neg_1 = extensions.pop()
        const ext_last_neg_2 = extensions.pop()

        // .excalidraw.svg
        if( ext_last_neg_1 == "svg" && ext_last_neg_2 == "excalidraw")
        {
            // nothing ,but will continue
        }
        else {
            // 如果不符合 .excalidraw.svg 结尾，直接使用默认渲染器
            return defaultImageRenderer(tokens, idx, options, env, self);
        }

        // continue here
        // --- 开始构建自定义 HTML ---

        // 1. 先用默认渲染器生成原始的 <img> 标签字符串
        //    这样做的好处是我们可以重用 markdown-it 内部处理 alt、title 等属性的逻辑
        const imgTag = defaultImageRenderer(tokens, idx, options, env, self);

        // 读取 .excalidraw.svg 文件内容
        // 可能会读取失败，所以需要捕获异常
        let error_msg = '';
        let blog_url = options.blog_url || md.env.blog_url || "";
        if(blog_url.endsWith("/")) blog_url = blog_url.slice(0, -1);
        let img_url = ""
        // console.log("image src:",src)
        try {
            if( src.startsWith("http://") || src.startsWith("https://") ){
                img_url = src
            }
            else if( src.startsWith("/") ){
                img_url = blog_url + src
            }
            else { // 相对路径
                console.log(md.env)
                let base_path = options.base_path || md.env.base_path || ".";
                let current_md_file_path = md.env.current_md_file_path || "";
                // console.log("current_md_file_path:", current_md_file_path)
                let real_img_path = Path.resolve( Path.dirname(current_md_file_path), src )


                if( !current_md_file_path || current_md_file_path.length == 0 ){
                    throw new Error("md.env.current_md_file_path is required for relative image path")
                }
                img_url = blog_url + "/" + Path.relative( base_path, real_img_path).replace(/\\/g,"/")
                // console.log("img_url:", img_url)
                
            }
        }
        catch (err) {
            error_msg = `Error reading file ${src}:` + err
            console.error(error_msg);
            // 如果读取失败，仍然返回原始的 img 标签
            return imgTag;
        }

        // 3. 将 <img> 和后缀标签包裹在一个 div 中
        const excalidraw_server_addrs = options.excalidraw_server_addrs || "https://excalidraw.com"
        let extensionBadge = `<a class="image-extension-badge" style="align-self: flex-end;" href="${excalidraw_server_addrs}/#url=${encodeURIComponent(img_url)}" target="_blank" title="Open in Excalidraw">Open in Excalidraw</a>`;
        if( error_msg.length > 0)
        {
            extensionBadge = `<span class="image-extension-badge" style="color:red;" title="Error">${error_msg}</span>`;
        }

        const wrappedImage = `<div class="image-wrapper" style="display:flex; flex-direction:column; align-items:center; width:100%; height:100%;"> ${extensionBadge} ${imgTag} </div>`;

        return wrappedImage;
    };
}

module.exports = imageExtensionPlugin;
