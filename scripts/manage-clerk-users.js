const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || 'sk_test_X7R0c3M2YAT3rvEB8TeTjcbCWLPzcUGDrZUEcKRyDK'

async function checkClerk() {
  const res = await fetch('https://api.clerk.com/v1/users?limit=20', {
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    console.error('Clerk error:', res.status, await res.text())
    return
  }
  const users = await res.json()
  console.log(`Clerk currently has ${users.length} users:`)
  for (const u of users) {
    console.log(`- ${u.id}: ${u.email_addresses?.[0]?.email_address} (${u.first_name || ''} ${u.last_name || ''})`)
  }
}

checkClerk().catch(console.error)

