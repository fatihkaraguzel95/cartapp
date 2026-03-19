const http = require('http')
const crypto = require('crypto')
const { exec } = require('child_process')

const SECRET = process.env.WEBHOOK_SECRET || ''
const DEPLOY_CMD = [
  'cd /opt/cartapp',
  'git pull origin master',
  'docker build -t cartapp .',
  'docker rm -f cartapp',
  'docker run -d --name cartapp --restart unless-stopped -p 3000:3000 cartapp',
].join(' && ')

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/deploy') {
    res.writeHead(404)
    res.end('Not found')
    return
  }

  let body = ''
  req.on('data', chunk => { body += chunk })
  req.on('end', () => {
    // Verify GitHub signature
    const sig = req.headers['x-hub-signature-256']
    if (SECRET) {
      const digest = 'sha256=' + crypto.createHmac('sha256', SECRET).update(body).digest('hex')
      if (sig !== digest) {
        console.log('Unauthorized request - invalid signature')
        res.writeHead(401)
        res.end('Unauthorized')
        return
      }
    }

    let payload
    try { payload = JSON.parse(body) } catch {
      res.writeHead(400)
      res.end('Bad request')
      return
    }

    // Only deploy on push to master
    if (payload.ref !== 'refs/heads/master') {
      console.log(`Skipping deploy for ref: ${payload.ref}`)
      res.writeHead(200)
      res.end('Skipped - not master')
      return
    }

    console.log(`Deploy triggered by: ${payload.pusher?.name || 'unknown'} — ${payload.head_commit?.message || ''}`)
    res.writeHead(200)
    res.end('Deploy started')

    exec(DEPLOY_CMD, { timeout: 300000 }, (err, stdout, stderr) => {
      if (err) {
        console.error('Deploy failed:', err.message)
        console.error(stderr)
      } else {
        console.log('Deploy successful')
        console.log(stdout)
      }
    })
  })
})

server.listen(9000, () => console.log('Webhook server running on port 9000'))
