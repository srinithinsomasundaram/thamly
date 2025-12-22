/**
 * Lightweight smoke checks for local dev/prod servers.
 * Usage: ensure `npm run dev` or `npm run start` is running, then:
 *   node scripts/ui-smoke.mjs
 */

const baseUrl = process.env.BASE_URL || "http://localhost:3000"

const endpoints = [
  { name: "home", url: "/" },
  { name: "editor", url: "/editor" },
  { name: "webpack chunk", url: "/_next/static/chunks/webpack.js" },
]

const apiChecks = [
  {
    name: "translate",
    url: "/api/translate",
    method: "POST",
    body: { text: "vanakkam", tone: "formal", mode: "standard" },
    okStatuses: [200, 503],
  },
  {
    name: "tamil-spelling-check",
    url: "/api/tamil-spelling-check",
    method: "POST",
    body: { text: "வனக்கம்" },
    okStatuses: [200, 503],
  },
  {
    name: "type-suggestions",
    url: "/api/type-suggestions",
    method: "POST",
    body: { word: "vanakkam" },
    okStatuses: [200, 503],
  },
]

async function checkEndpoint({ name, url }) {
  const res = await fetch(baseUrl + url)
  return { name, url, status: res.status, ok: res.ok }
}

async function checkApi({ name, url, method = "POST", body, okStatuses = [200] }) {
  const res = await fetch(baseUrl + url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const ok = okStatuses.includes(res.status)
  let detail = ""
  try {
    const data = await res.json()
    detail = JSON.stringify(data).slice(0, 200)
  } catch {
    detail = "non-JSON response"
  }
  return { name, url, status: res.status, ok, detail }
}

async function main() {
  console.log(`Running smoke checks against ${baseUrl}`)
  const pageResults = await Promise.all(endpoints.map(checkEndpoint))
  const apiResults = await Promise.all(apiChecks.map(checkApi))

  console.log("\nPages:")
  pageResults.forEach((r) => console.log(`- ${r.name} (${r.url}): ${r.status} ${r.ok ? "OK" : "FAIL"}`))

  console.log("\nAPIs:")
  apiResults.forEach((r) =>
    console.log(`- ${r.name} (${r.url}): ${r.status} ${r.ok ? "OK" : "FAIL"} ${r.detail ? `→ ${r.detail}` : ""}`),
  )

  const failures = [...pageResults.filter((r) => !r.ok), ...apiResults.filter((r) => !r.ok)]
  if (failures.length) {
    console.error("\nFailures detected. See above for statuses.")
    process.exitCode = 1
  } else {
    console.log("\nAll smoke checks passed.")
  }
}

main().catch((err) => {
  console.error("Smoke checks failed:", err)
  process.exitCode = 1
})
