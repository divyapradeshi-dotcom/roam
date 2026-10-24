const POSTHOG_TOKEN = 'phc_z25VG7UKoBRdkQkrnwCkYtBgifV5HGHXqzTiiLYb89nR'
const POSTHOG_HOST = 'https://us.i.posthog.com'

async function testPostHog() {
  const payload = {
    api_key: POSTHOG_TOKEN,
    batch: [
      {
        event: 'test_event',
        distinct_id: 'test_distinct_id_123',
        properties: {
          $lib: 'posthog-react-native',
          $lib_version: '4.83.0',
          test: true,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  }

  const res = await fetch(`${POSTHOG_HOST}/batch/`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
  })

  console.log('PostHog batch response:', res.status, await res.text())
}

testPostHog().catch(console.error)

