import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { marked } from 'marked'

const postModules = import.meta.glob('../posts/*.md', { query: '?raw', import: 'default' })

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)/)
  if (!match) return { data: {}, content: raw }
  const data = {}
  match[1].split('\n').forEach(line => {
    const colonIdx = line.indexOf(':')
    if (colonIdx > 0) {
      data[line.slice(0, colonIdx).trim()] = line.slice(colonIdx + 1).trim()
    }
  })
  return { data, content: match[2] }
}

function getSlug(path) {
  return path.replace('../posts/', '').replace('.md', '')
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    async function load() {
      const loaded = await Promise.all(
        Object.entries(postModules).map(async ([path, fn]) => {
          const raw = await fn()
          const { data } = parseFrontmatter(raw)
          return { slug: getSlug(path), ...data }
        })
      )
      loaded.sort((a, b) => new Date(b.date) - new Date(a.date))
      setPosts(loaded)
    }
    load()
  }, [])

  const categories = ['All', ...new Set(posts.map(p => p.category).filter(Boolean))]
  const filtered = activeCategory === 'All' ? posts : posts.filter(p => p.category === activeCategory)

  return (
    <main className="blog-main">
      <div className="blog-header">
        <h1>Blog</h1>
        <div className="category-filters">
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-btn${activeCategory === cat ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div className="posts-grid">
        {filtered.map(post => (
          <Link key={post.slug} to={`/blog/${post.slug}`} className="post-card">
            <span className="post-category">{post.category}</span>
            <h2>{post.title}</h2>
            <p className="post-excerpt">{post.excerpt}</p>
            <time className="post-date">{formatDate(post.date)}</time>
          </Link>
        ))}
      </div>
    </main>
  )
}
