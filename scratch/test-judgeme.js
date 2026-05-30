const url = "https://lufaajskin.com/products/turmeric-brightening-face-moisturizer"

async function run() {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    })
    const html = await response.text()
    const blocks = html.split(/<div\s+[^>]*class=['"]jdgm-rev(?:\s+|['"])/)
    if (blocks.length > 1) {
      console.log("Raw HTML block of review 1:")
      console.log(blocks[1].substring(0, 1500))
    }
  } catch (err) {
    console.error(err)
  }
}

run()
