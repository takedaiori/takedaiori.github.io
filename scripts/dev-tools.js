#!/usr/bin/env node

/**
 * 开发工具脚本
 * 提供与博客运行相关的开发辅助功能。
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function runCommand(command, description) {
  log(`\n🔧 ${description}...`, 'blue')
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' })
    log(`✅ ${description} 完成`, 'green')
    return { success: true, output }
  } catch (error) {
    log(`❌ ${description} 失败`, 'red')
    if (error.stdout) console.log(error.stdout)
    if (error.stderr) console.error(error.stderr)
    return { success: false, error: error.message }
  }
}

function initDev() {
  log('🚀 初始化开发环境', 'magenta')

  const nodeVersion = process.version
  log(`Node.js 版本: ${nodeVersion}`, 'cyan')

  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim()
    log(`npm 版本: ${npmVersion}`, 'cyan')
  } catch (error) {
    log('npm 未安装', 'red')
    return
  }

  runCommand('npm install', '安装依赖')
  checkEnvFile()
  runCommand('npm run quality', '代码质量检查')

  log('\n🎉 开发环境初始化完成！', 'green')
  log('💡 运行 npm run dev 开始开发', 'cyan')
}

function checkEnvFile() {
  log('\n📋 检查环境变量配置...', 'blue')

  const envExample = path.join(process.cwd(), '.env.example')
  const envLocal = path.join(process.cwd(), '.env.local')

  if (!fs.existsSync(envExample)) {
    log('⚠️  .env.example 文件不存在', 'yellow')
    return
  }

  if (!fs.existsSync(envLocal)) {
    log('⚠️  .env.local 文件不存在，正在创建...', 'yellow')
    try {
      fs.copyFileSync(envExample, envLocal)
      log('✅ 已创建 .env.local 文件，请配置必要的环境变量', 'green')
    } catch (error) {
      log('❌ 创建 .env.local 文件失败', 'red')
    }
  } else {
    log('✅ .env.local 文件存在', 'green')
  }

  const requiredVars = ['NOTION_PAGE_ID']
  const envContent = fs.readFileSync(envLocal, 'utf8')

  const missingVars = requiredVars.filter(varName => {
    const regex = new RegExp(`^${varName}=.+`, 'm')
    return !regex.test(envContent)
  })

  if (missingVars.length > 0) {
    log(`⚠️  缺少必要的环境变量: ${missingVars.join(', ')}`, 'yellow')
    log('请在 .env.local 文件中配置这些变量', 'yellow')
  } else {
    log('✅ 所有必要的环境变量都已配置', 'green')
  }
}

function clean() {
  log('🧹 清理项目文件...', 'magenta')

  const dirsToClean = ['.next', 'out', 'node_modules/.cache', 'coverage', '.nyc_output']

  dirsToClean.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir)
    if (fs.existsSync(fullPath)) {
      runCommand(`rm -rf ${fullPath}`, `清理 ${dir}`)
    } else {
      log(`📁 ${dir} 不存在，跳过`, 'cyan')
    }
  })

  log('✅ 项目清理完成', 'green')
}

function generateComponent(componentName) {
  if (!componentName) {
    log('❌ 请提供组件名称', 'red')
    log('用法: npm run dev-tools generate:component MyComponent', 'cyan')
    return
  }

  log(`🎨 生成组件: ${componentName}`, 'magenta')

  const componentDir = path.join(process.cwd(), 'components', componentName)
  const componentFile = path.join(componentDir, 'index.js')
  const styleFile = path.join(componentDir, 'style.module.css')

  if (!fs.existsSync(componentDir)) {
    fs.mkdirSync(componentDir, { recursive: true })
  }

  const componentTemplate = `import styles from './style.module.css'

/**
 * ${componentName} 组件
 * @param {object} props 组件属性
 * @returns {JSX.Element}
 */
const ${componentName} = ({ children, className = '', ...props }) => {
  return (
    <div className={\`\${styles.container} \${className}\`} {...props}>
      {children}
    </div>
  )
}

export default ${componentName}
`

  const styleTemplate = `.container {
  /* ${componentName} 样式 */
}
`

  fs.writeFileSync(componentFile, componentTemplate)
  fs.writeFileSync(styleFile, styleTemplate)

  log(`✅ 组件 ${componentName} 生成完成`, 'green')
  log(`📁 位置: ${componentDir}`, 'cyan')
}

function analyzeBundle() {
  log('📊 分析包大小...', 'magenta')
  runCommand('npm run bundle-report', '生成包分析报告')
  log('📈 包分析完成，请查看生成的报告', 'green')
}

function checkUpdates() {
  log('🔍 检查依赖更新...', 'magenta')
  runCommand('npm outdated', '检查过时的依赖')
  log('💡 运行 npm update 更新依赖', 'cyan')
}

function main() {
  const command = process.argv[2]
  const arg = process.argv[3]

  switch (command) {
    case 'init':
      initDev()
      break
    case 'clean':
      clean()
      break
    case 'generate:component':
      generateComponent(arg)
      break
    case 'analyze':
      analyzeBundle()
      break
    case 'check-updates':
      checkUpdates()
      break
    default:
      log('🛠️  NotionNext 开发工具', 'magenta')
      log('\n可用命令:', 'cyan')
      log('  init              - 初始化开发环境', 'cyan')
      log('  clean             - 清理项目文件', 'cyan')
      log('  generate:component <name> - 生成组件模板', 'cyan')
      log('  analyze           - 分析包大小', 'cyan')
      log('  check-updates     - 检查依赖更新', 'cyan')
      log('\n用法: npm run dev-tools <command> [args]', 'yellow')
  }
}

if (require.main === module) {
  main()
}

module.exports = {
  initDev,
  clean,
  generateComponent,
  analyzeBundle,
  checkUpdates
}
