import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

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

function SubscribeForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      await res.json()
      if (res.status === 409) { setStatus('duplicate'); return }
      if (!res.ok) { setStatus('error'); return }
      setStatus('success')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="subscribe-section">
      <h2>Stay in the loop</h2>
      <p>Get new posts delivered straight to your inbox.</p>
      {status === 'success' ? (
        <p className="subscribe-feedback">You're in! Check your inbox for a welcome email.</p>
      ) : status === 'duplicate' ? (
        <p className="subscribe-feedback">You're already subscribed — no need to sign up again.</p>
      ) : (
        <form className="subscribe-form" onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="subscribe-input"
            disabled={status === 'loading'}
          />
          <button type="submit" className="subscribe-btn" disabled={status === 'loading'}>
            {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
          </button>
          {status === 'error' && (
            <p className="subscribe-feedback error">Something went wrong. Please try again.</p>
          )}
        </form>
      )}
    </section>
  )
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
      <SubscribeForm />
    </main>
  )
}
