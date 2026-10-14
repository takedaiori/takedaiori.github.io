import Hero from './Hero'
import PostCard from './PostCard'
import CONFIG from '../config'

const HomePage = props => {
  const source =
    (Array.isArray(props?.latestPosts) && props.latestPosts.length > 0
      ? props.latestPosts
      : props?.posts) || []

  const posts = source
    .filter(post => post && post.type !== 'Menu' && post.type !== 'SubMenu')
    .slice(0, CONFIG.INSIGNIFICANTIA_HOME_POST_COUNT)

  return (
    <>
      <Hero />
      <section className='ins-home-content' id='posts'>
        <div className='ins-post-list'>
          {posts.map((post, index) => (
            <PostCard
              key={post.id || post.pageId || post.slug || `${post.title}-${index}`}
              post={post}
            />
          ))}
        </div>

        <div className='ins-home-end-actions'>
          <a className='ins-btn primary' href='/page/1'>
            浏览全部
          </a>
          <a className='ins-btn' href='#top'>
            返回顶部
          </a>
        </div>
      </section>
    </>
  )
}

export default HomePage
