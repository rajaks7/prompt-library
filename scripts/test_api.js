const fetch = require('node-fetch')

const base = process.env.BASE_URL || 'http://localhost:3000'

async function call(qs) {
  const url = `${base}/api/prompts?${qs}`
  try {
    const res = await fetch(url)
    const text = await res.text()
    console.log('URL:', url)
    console.log('Status:', res.status)
    console.log('Body:', text)
  } catch (err) {
    console.error('Fetch error', err.message)
  }
}

async function main() {
  await call('page=1&limit=5')
  await call('page=1&limit=5&tool=')
  await call('page=1&limit=5&tool=OpenAI')
  await call('page=1&limit=5&category=')
  await call('page=1&limit=5&category=Writing')
}

main()
