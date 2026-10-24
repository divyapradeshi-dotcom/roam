const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || 'sk_test_X7R0c3M2YAT3rvEB8TeTjcbCWLPzcUGDrZUEcKRyDK'

async function ensureUser(email, firstName, lastName) {
  // First check if user exists
  const listRes = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`, {
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  })
  if (listRes.ok) {
    const list = await listRes.json()
    if (list.length > 0) {
      console.log(`User ${email} already exists:`, list[0].id)
      return list[0].id
    }
  }

  // Create user
  const createRes = await fetch('https://api.clerk.com/v1/users', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email_address: [email],
      password: 'Password123!',
      first_name: firstName,
      last_name: lastName,
      skip_password_checks: true,
      skip_password_requirement: false,
    }),
  })

  if (!createRes.ok) {
    const errText = await createRes.text()
    console.error(`Failed to create ${email}:`, createRes.status, errText)
    throw new Error(errText)
  }

  const created = await createRes.json()
  console.log(`Created Clerk user ${email}:`, created.id)
  return created.id
}

ensureUser('roam.demo1+clerk_test@example.com', 'Alex', 'Demo')
  .then((id) => console.log('Success:', id))
  .catch(console.error)

