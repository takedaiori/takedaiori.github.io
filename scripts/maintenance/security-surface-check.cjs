'use strict'
const fs = require('node:fs')
const assert = require('node:assert/strict')
const path = require('node:path')
function check(root = '.') {
  for (const file of ['public/dplayer.htm', 'public/games-external/common/index.htm']) {
    const text = fs.readFileSync(path.join(root, file), 'utf8')
    assert(!/<(?:script|iframe)\b/i.test(text), `${file}: active legacy entry point`)
    assert(text.includes("default-src 'none'"), `${file}: missing restrictive CSP`)
  }
  const plugins = fs.readFileSync(path.join(root, 'components/ExternalPlugins.js'), 'utf8')
  assert(!/\beval\s*\(|\bnew\s+Function\s*\(/.test(plugins), 'Executable configuration is forbidden')
  assert(!plugins.includes('CUSTOM_EXTERNAL_JS'), 'Notion-controlled JavaScript is forbidden')
  const debug = fs.readFileSync(path.join(root, 'components/VConsole.js'), 'utf8')
  assert(!/https?:\/\/|loadExternalResource|createElement/.test(debug), 'Remote debug loader is forbidden')
  for (const file of ['pages/api/auth/callback/notion.ts', 'pages/auth/index.js']) {
    const text = fs.readFileSync(path.join(root, file), 'utf8')
    assert(!/fetchToken|axios|access_token|clientSecret/.test(text), `${file}: unsafe legacy OAuth exchange restored`)
  }
  console.log('Public security boundaries verified')
}
module.exports = { check }
if (require.main === module) check()
