# markdown-it-pseudocodejs

Add pseudocode to your Markdown

## Usage
Install markdown-it
```
npm install markdown-it
```

Install the plugin

```
npm install markdown-it-pseudocodejs
```

Use it in your javascript

```javascript
var md = require('markdown-it')(),
    mk = require('markdown-it-pseudocodejs');

md.use(mk);
```

Make sure KaTeX is set up correctly. This includes making sure you include the KaTeX stylesheet in your html:
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.5.1/katex.min.css">
```

If you're using the default markdown-it parser, I also recommend the [github stylesheet](https://github.com/sindresorhus/github-markdown-css):
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/github-markdown-css/2.2.1/github-markdown.css"/>
```

Also, make sure you include the Pseudocode.js CSS:

```html
<link rel="stylesheet" href="<node_modules_path>/pseudocode.js-1.1.0/pseudocode.min.css">
```

Please see https://github.com/tatetian/pseudocode.js for syntax and usage instructions of the library itself. The library is not NPM-enabled so it has been copied manually into this repository. This repo currently contains v1.1.0. The author of the Pseudocode.js library is [Tate Tian](https://github.com/tatetian).