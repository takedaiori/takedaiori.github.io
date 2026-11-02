// Run only with a read-only token and no application secrets.
const sharp = require('sharp')
async function main() {
  const chunks = []
  let size = 0
  for await (const chunk of process.stdin) {
    size += chunk.length
    if (size > 20 * 1024 * 1024) throw new Error('Image exceeds byte limit')
    chunks.push(chunk)
  }
  sharp.concurrency(1)
  const image = sharp(Buffer.concat(chunks), { limitInputPixels: 40000000, failOn: 'warning' }).timeout({ seconds: 10 })
  const info = await image.metadata()
  if (info.format !== 'webp' || !info.width || !info.height || info.width > 12000 || info.height > 12000 ||
      (info.pages || 1) !== 1 || info.exif || info.xmp || info.iptc) throw new Error('Unsupported image dimensions, animation or metadata')
  await image.raw().toBuffer() // Full decode: a header alone is insufficient.
  console.log(`Decoded WebP ${info.width}x${info.height}`)
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
