import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { marked } from 'marked'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

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

function relativeDate(dateStr) {
  return dayjs(dateStr).fromNow()
}

function CopyLinkButton() {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button className="copy-link-btn" onClick={handleCopy}>
      {copied ? (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          Copy Link
        </>
      )}
    </button>
  )
}

export default function BlogPost() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const key = `../posts/${slug}.md`
      const fn = postModules[key]
      if (!fn) { setNotFound(true); return }
      const raw = await fn()
      const { data, content } = parseFrontmatter(raw)
      setPost({ ...data, html: marked(content) })
    }
    load()
  }, [slug])

  if (notFound) {
    return (
      <main className="post-main">
        <Link to="/blog" className="back-link">← Back to Blog</Link>
        <p className="text-muted">Post not found.</p>
      </main>
    )
  }

  if (!post) return <main className="post-main"><p className="text-muted">Loading…</p></main>

  return (
    <main className="post-main">
      <div className="post-nav-row">
        <Link to="/blog" className="back-link">← Back to Blog</Link>
      </div>
      <article>
        <header className="post-header">
          <span className="post-category">{post.category}</span>
          <h1>{post.title}</h1>
          <div className="post-author-row">
            <div className="post-author-info">
              <img src="/Paula.JPG" alt="Paula" className="post-author-avatar" />
              <div className="post-author-meta">
                <strong>Paula</strong>
                <time>{relativeDate(post.date)}</time>
              </div>
            </div>
            <CopyLinkButton />
          </div>
        </header>
        <div className="post-content" dangerouslySetInnerHTML={{ __html: post.html }} />
      </article>
    </main>
  )
}
