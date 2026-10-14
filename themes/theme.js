import BLOG, { LAYOUT_MAPPINGS } from '@/blog.config'
import getConfig from 'next/config'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { getQueryParam, getQueryVariable, isBrowser } from '../lib/utils'

// 在next.config.js中扫描所有主题
export const { THEMES = [] } = getConfig()?.publicRuntimeConfig || {}
const baseLayoutCache = new Map()
const layoutByThemeCache = new Map()
let domFixTimer = null

const LayoutLoading = () => (
  <div
    data-ins-loading='page'
    className='min-h-screen w-full bg-[#202d35]'
  />
)

const EmptyBaseLayout = ({ children }) => <>{children}</>
const EmptyPageLayout = () => null

/**
 * Insignificantia. loading shell.
 *
 * IMPORTANT:
 * This replaces only the visual placeholder used while LayoutIndex is
 * dynamically imported. It does not change theme resolution, routing,
 * caching, fallback, or data loading logic.
 */
const IndexLayoutLoading = () => (
  <main
    data-ins-loading='home'
    className='min-h-screen w-full bg-[#202d35] text-[#f2eee4]'>
    <section className='min-h-[650px] w-full border-b border-[rgba(225,231,226,.04)] bg-[#202d35]'>
      <div className='mx-auto grid min-h-[650px] w-full max-w-[1400px] items-center gap-[29px] px-[34px] py-[82px] xl:grid-cols-[minmax(0,1fr)_620px]'>
        <div>
          <div className='mb-[22px] h-3 w-44 animate-pulse rounded-sm bg-[#ed8eac]/35' />
          <div className='h-16 w-[86%] max-w-[640px] animate-pulse rounded-md bg-[#f2eee4]/10' />
          <div className='mt-5 h-16 w-[72%] max-w-[520px] animate-pulse rounded-md bg-[#f2eee4]/10' />
          <div className='mt-8 h-4 w-[76%] max-w-[610px] animate-pulse rounded-sm bg-[#aeb9b9]/15' />
          <div className='mt-3 h-4 w-[58%] max-w-[470px] animate-pulse rounded-sm bg-[#aeb9b9]/15' />
          <div className='mt-8 flex gap-3'>
            <div className='h-11 w-28 animate-pulse rounded-[9px] bg-[#ed8eac]/28' />
            <div className='h-11 w-24 animate-pulse rounded-[9px] border border-[rgba(237,142,172,.28)] bg-transparent' />
          </div>
        </div>

        <div className='w-full'>
          <div className='aspect-[1.17/1] w-full animate-pulse rounded-[9px] border border-[rgba(225,231,226,.10)] bg-[#2b3942]' />
        </div>
      </div>
    </section>

    <section className='mx-auto w-full max-w-[900px] px-[18px] py-[88px] md:px-0'>
      {[0, 1, 2].map(item => (
        <div
          key={item}
          className='mb-11 rounded-[9px] border border-[rgba(225,231,226,.10)] bg-[#2b3942] px-8 py-9 md:px-[54px] md:py-[46px]'>
          <div className='h-3 w-28 animate-pulse rounded-sm bg-[#ed8eac]/30' />
          <div className='mt-5 h-8 w-[72%] animate-pulse rounded-sm bg-[#f2eee4]/10' />
          <div className='mt-5 h-4 w-full animate-pulse rounded-sm bg-[#aeb9b9]/13' />
          <div className='mt-3 h-4 w-[84%] animate-pulse rounded-sm bg-[#aeb9b9]/13' />
        </div>
      ))}
    </section>
  </main>
)

const getLayoutLoading = layoutName => {
  if (layoutName === 'LayoutIndex') {
    return IndexLayoutLoading
  }
  return LayoutLoading
}

const getConfiguredThemeName = () => {
  const configuredTheme =
    typeof BLOG.THEME === 'string' ? BLOG.THEME.split(',')[0].trim() : ''

  if (configuredTheme && THEMES.includes(configuredTheme)) {
    return configuredTheme
  }
  if (THEMES.includes('insignificantia')) {
    return 'insignificantia'
  }
  return THEMES[0] || configuredTheme || 'insignificantia'
}

const normalizeThemeName = themeValue => {
  const defaultTheme = getConfiguredThemeName()
  if (!themeValue || typeof themeValue !== 'string') return defaultTheme
  const firstTheme = themeValue.split(',')[0].trim()
  if (!firstTheme) return defaultTheme
  return THEMES.includes(firstTheme) ? firstTheme : defaultTheme
}

const getThemeExport = (mod, exportName) => {
  if (mod?.[exportName]) return mod[exportName]
  if (mod?.default?.[exportName]) return mod.default[exportName]
  if (exportName === 'LayoutBase' && typeof mod?.default === 'function') {
    return mod.default
  }
  return null
}

const scheduleFixThemeDOM = (delay = 120) => {
  if (!isBrowser) return
  if (domFixTimer) {
    clearTimeout(domFixTimer)
  }
  domFixTimer = setTimeout(() => {
    fixThemeDOM()
    domFixTimer = null
  }, delay)
}

async function importThemeConfig(themeFolderName) {
  try {
    const mod = await import(`@/themes/${themeFolderName}`)
    return getThemeExport(mod, 'THEME_CONFIG')
  } catch (err) {
    console.error(`Failed to load theme config "${themeFolderName}":`, err)
    return null
  }
}

async function importThemeLayout(themeFolderName, layoutName) {
  try {
    const mod = await import(`@/themes/${themeFolderName}`)
    return (
      getThemeExport(mod, layoutName) ||
      getThemeExport(mod, 'LayoutSlug') ||
      null
    )
  } catch (err) {
    console.error(`Failed to load theme "${themeFolderName}":`, err)
    return null
  }
}

async function resolveThemeLayout(themeName, layoutName, emptyLayout) {
  const Layout = await importThemeLayout(themeName, layoutName)
  if (Layout) return Layout

  console.warn(`[theme] "${themeName}" missing "${layoutName}", using empty layout.`)
  return emptyLayout
}

/**
 * 获取主题配置（始终动态加载，与运行时 BLOG.THEME / URL ?theme 一致；不依赖编译期别名）。
 * @param {string} themeQuery - 主题查询参数（支持多个主题用逗号分隔）
 * @returns {Promise<object|null>} 主题配置对象
 */
export const getThemeConfig = async themeQuery => {
  const themeName = normalizeThemeName(themeQuery)
  const cfg = await importThemeConfig(themeName)
  if (cfg) {
    return cfg
  }
  console.warn(
    `[theme] "${themeName}" configuration unavailable, using empty config.`
  )
  return {}
}

/**
 * 获取当前主题（query 主题优先，且做合法性校验）
 */
const getCurrentTheme = (router, fallbackTheme) => {
  const queryTheme = getQueryParam(router?.asPath, 'theme')
  if (queryTheme) {
    return normalizeThemeName(queryTheme)
  }
  return normalizeThemeName(fallbackTheme || BLOG.THEME)
}

/**
 * 加载全局布局
 * @param {*} theme
 * @returns
 */
export const getBaseLayoutByTheme = theme => {
  const normalizedTheme = normalizeThemeName(theme)
  if (baseLayoutCache.has(normalizedTheme)) {
    return baseLayoutCache.get(normalizedTheme)
  }
  const DynamicBaseLayout = dynamic(
    () =>
      resolveThemeLayout(normalizedTheme, 'LayoutBase', EmptyBaseLayout),
    { ssr: true }
  )
  baseLayoutCache.set(normalizedTheme, DynamicBaseLayout)
  return DynamicBaseLayout
}

/**
 * 动态获取布局
 * @param {*} props
 */
export const DynamicLayout = props => {
  const { theme, layoutName } = props
  const SelectedLayout = useLayoutByTheme({ layoutName, theme })
  return <SelectedLayout {...props} />
}

/**
 * 加载主题文件
 * @param {*} layoutName
 * @param {*} theme
 * @returns
 */
export const useLayoutByTheme = ({ layoutName, theme }) => {
  const router = useRouter()
  const themeQuery = getCurrentTheme(router, theme)
  const cacheKey = `${themeQuery}:${layoutName}`
  const isConfiguredTheme = themeQuery === getConfiguredThemeName()

  if (layoutByThemeCache.has(cacheKey)) {
    scheduleFixThemeDOM(isConfiguredTheme ? 80 : 240)
    return layoutByThemeCache.get(cacheKey)
  }

  const loadLayout = () =>
    resolveThemeLayout(themeQuery, layoutName, EmptyPageLayout)
  const DynamicLayoutComponent = dynamic(loadLayout, {
    ssr: true,
    loading: getLayoutLoading(layoutName)
  })
  layoutByThemeCache.set(cacheKey, DynamicLayoutComponent)
  scheduleFixThemeDOM(isConfiguredTheme ? 80 : 240)
  return DynamicLayoutComponent
}

/**
 * 根据路径 获取对应的layout名称
 * @param {*} path
 * @returns
 */
const getLayoutNameByPath = path => {
  const layoutName = LAYOUT_MAPPINGS[path] || 'LayoutSlug'
  //   console.log('path-layout',path,layoutName)
  return layoutName
}

/**
 * 切换主题时的特殊处理
 * 删除多余的元素
 */
const fixThemeDOM = () => {
  if (isBrowser) {
    const elements = document.querySelectorAll('[id^="theme-"]')
    if (elements?.length > 1) {
      for (let i = 0; i < elements.length - 1; i++) {
        if (
          elements[i] &&
          elements[i].parentNode &&
          elements[i].parentNode.contains(elements[i])
        ) {
          elements[i].parentNode.removeChild(elements[i])
        }
      }
      elements[0]?.scrollIntoView()
    }
  }
}

/**
 * 初始化主题 , 优先级 query > cookies > systemPrefer
 * @param isDarkMode
 * @param updateDarkMode 更改主题ChangeState函数
 * @description 读取cookie中存的用户主题
 */
export const initDarkMode = (updateDarkMode, defaultDarkMode) => {
  // 查看用户设备浏览器是否深色模型
  let newDarkMode = isPreferDark()

  // 查看localStorage中用户记录的是否深色模式
  const userDarkMode = loadDarkModeFromLocalStorage()
  if (userDarkMode) {
    newDarkMode = userDarkMode === 'dark' || userDarkMode === 'true'
    saveDarkModeToLocalStorage(newDarkMode) // 用户手动的才保存
  }

  // 如果站点强制设置默认深色，则优先级改过用
  if (defaultDarkMode === 'true') {
    newDarkMode = true
  }

  // url查询条件中是否深色模式
  const queryMode = getQueryVariable('mode')
  if (queryMode) {
    newDarkMode = queryMode === 'dark'
  }

  updateDarkMode(newDarkMode)
  document
    .getElementsByTagName('html')[0]
    .setAttribute('class', newDarkMode ? 'dark' : 'light')
}

/**
 * 是否优先深色模式， 根据系统深色模式以及当前时间判断
 * @returns {*}
 */
export function isPreferDark() {
  if (BLOG.APPEARANCE === 'dark') {
    return true
  }
  if (BLOG.APPEARANCE === 'auto') {
    // 系统深色模式或时间是夜间时，强行置为夜间模式
    const date = new Date()
    const prefersDarkMode = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches
    return (
      prefersDarkMode ||
      (BLOG.APPEARANCE_DARK_TIME &&
        (date.getHours() >= BLOG.APPEARANCE_DARK_TIME[0] ||
          date.getHours() < BLOG.APPEARANCE_DARK_TIME[1]))
    )
  }
  return false
}

/**
 * 读取深色模式
 * @returns {*}
 */
export const loadDarkModeFromLocalStorage = () => {
  return localStorage.getItem('darkMode')
}

/**
 * 保存深色模式
 * @param newTheme
 */
export const saveDarkModeToLocalStorage = newTheme => {
  localStorage.setItem('darkMode', newTheme)
}