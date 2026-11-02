'use strict'
// Static-host fallback. HTTP frame-ancestors/X-Frame-Options remain preferable.
const frameGuardStyle = 'html{display:none!important}'
const frameGuardScript = "(function(){try{if(window.self===window.top){var s=document.getElementById('ins-frame-guard');if(s)s.remove()}}catch(e){}})();"
const frameGuardNoScriptStyle = 'html{display:block!important}body>*{display:none!important}body>noscript#ins-frame-noscript{display:block!important;padding:24px;font:16px/1.8 system-ui}'
const frameGuardMessage = '为防止页面被嵌入冒用，本站需要启用 JavaScript 后直接访问。请在浏览器地址栏打开本站。'
const headMarkup = `<style id="ins-frame-guard">${frameGuardStyle}</style><script id="ins-frame-guard-script">${frameGuardScript}</script><noscript><style>${frameGuardNoScriptStyle}</style></noscript>`
const bodyMarkup = `<noscript id="ins-frame-noscript">${frameGuardMessage}</noscript>`
module.exports = { frameGuardStyle, frameGuardScript, frameGuardNoScriptStyle, frameGuardMessage, headMarkup, bodyMarkup }
