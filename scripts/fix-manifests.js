const fs = require("fs")
const path = require("path")

// Workaround for Next 14 parallel-route manifest copy bug on deploy platforms.
// Touch expected client-reference manifests so output tracing doesn't fail with ENOENT.
const manifestPaths = [
  path.join(".next", "server", "app", "(workspace)", "@tabs", "drafts", "page_client-reference-manifest.js"),
  path.join(".next", "server", "app", "(workspace)", "page_client-reference-manifest.js"),
]

manifestPaths.forEach((p) => {
  const dir = path.dirname(p)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, "", "utf8")
  }
})
