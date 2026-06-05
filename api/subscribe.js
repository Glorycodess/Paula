export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email required' })

  // Insert into Supabase via REST API
  const insertRes = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/subscribers`,
    {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ email }),
    }
  )

  if (insertRes.status === 409) {
    return res.status(409).json({ error: 'Already subscribed' })
  }
  if (!insertRes.ok) {
    return res.status(500).json({ error: 'Failed to save email' })
  }

  // Send welcome email via Resend
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Paula <hi@paulasblog.com>',
      to: email,
      subject: "You're subscribed to Paula's blog",
      html: `<p>Hey! Thanks for subscribing.</p><p>I'll send you new posts as they go live.</p><p>— Paula</p>`,
    }),
  })

  return res.status(200).json({ success: true })
}
