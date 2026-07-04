/**
 * Export OpenAPI 3.0 spec from the running NestJS app.
 *
 * Usage:
 *   node export-openapi.js
 *
 * Output:
 *   saas-api/openapi/openapi.json
 *
 * Env:
 *   PORT        - app listen port, default 3001
 *   PREFIX      - API prefix, default saas/api
 *   OPENAPI_OUT - output file path, default openapi/openapi.json
 */

const fs = require('fs')
const path = require('path')
const http = require('http')

const PORT = Number(process.env.PORT || 3001)
const PREFIX = (process.env.PREFIX || 'saas/api').replace(/^\/|\/$/g, '')
const OUTPUT = process.env.OPENAPI_OUT || path.join(__dirname, 'openapi.json')

async function waitForServer(port, timeout = 120000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: `/${PREFIX}/docs-json`,
          method: 'GET',
          timeout: 2000,
        },
        (res) => {
          let data = ''
          res.on('data', (chunk) => (data += chunk))
          res.on('end', () => {
            if (res.statusCode === 200) {
              resolve(data)
            } else {
              reject(new Error(`docs endpoint returned ${res.statusCode}`))
            }
          })
        }
      )
      req.on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error(`timeout waiting for ${PORT}`))
        } else {
          setTimeout(tick, 1000)
        }
      })
      req.end()
    }
    tick()
  })
}

async function main() {
  const outputDir = path.dirname(OUTPUT)
  fs.mkdirSync(outputDir, { recursive: true })

  console.log(`Waiting for http://127.0.0.1:${PORT}/${PREFIX}/docs-json`)
  const json = await waitForServer(PORT)
  fs.writeFileSync(OUTPUT, json, 'utf8')
  console.log(`OpenAPI exported -> ${OUTPUT}`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
