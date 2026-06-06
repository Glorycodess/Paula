export default async function handler(req, res) {
  console.log('ENV CHECK:', {
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
    hasResendKey: !!process.env.RESEND_API_KEY,
    supabaseUrl: process.env.SUPABASE_URL
  })

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const missing = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'].filter(k => !process.env[k])
    console.error('Missing environment variables:', missing.join(', '))
    return res.status(500).json({ error: 'Server misconfiguration' })
  }

  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email required' })

  let insertRes
  try {
    insertRes = await fetch(`${SUPABASE_URL}/rest/v1/subscribers`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ email }),
    })
  } catch (err) {
    console.error('Supabase fetch threw:', err)
    return res.status(500).json({ error: 'Failed to save email' })
  }

  if (insertRes.status === 409) {
    return res.status(409).json({ error: 'Already subscribed' })
  }
  if (!insertRes.ok) {
    const body = await insertRes.text()
    console.error('Supabase insert failed —', insertRes.status, body)
    return res.status(500).json({ error: 'Failed to save email' })
  }

  // Welcome email disabled until domain is verified in Resend.
  // To re-enable: uncomment the block below and verify your sending domain
  // at resend.com/domains, then update the `from` address.
  //
  // try {
  //   const emailRes = await fetch('https://api.resend.com/emails', {
  //     method: 'POST',
  //     headers: {
  //       Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       from: 'Paula <hi@yourdomain.com>',
  //       to: email,
  //       subject: "You're subscribed to Paula's blog",
  //       html: `<p>Hey! Thanks for subscribing.</p><p>I'll send you new posts as they go live.</p><p>— Paula</p>`,
  //     }),
  //   })
  //   if (!emailRes.ok) {
  //     const body = await emailRes.text()
  //     console.error('Resend failed —', emailRes.status, body)
  //   }
  // } catch (err) {
  //   console.error('Resend threw:', err)
  // }

  return res.status(200).json({ success: true })
}
