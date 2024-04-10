import puppeteer, { KnownDevices } from "puppeteer"
import readline from "readline"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const measureNetworkRequestWeights = async (url: string): Promise<void> => {
  const m = KnownDevices["Moto G4"]

  const browser = await puppeteer.launch({
    
    headless: false,
    args: [
      // mobile emulation
      "--disable-infobars",
      "--disable-extensions",
      "--disable-notifications",
      "--disable-popup-blocking",
      "--disable-default-apps",
      "--disable-dev-shm-usage",
      "--disable-device-discovery-notifications",
      "--no-sandbox",
      "--no-zygote",
    ],
  })
  const page = await browser.newPage()

  await page.emulate(m)

  let totalWeight = 0

  // page.on("response", async (response) => {
  //   const request = response.request()
  //   const headers = response.headers()

  //   const contentLength = (await response.text()).length
  //   console.log("🚀 ~ contentLength:", contentLength)
  //   if (contentLength) {
  //     totalWeight += Number(contentLength)
  //   }
  // })

  const addResponseSize = async (response: any) => {
    try {
      const buffer = await response.buffer()
      totalWeight += buffer.length
    } catch {
      // Error: Response body is unavailable for redirect responses
      // TODO: other errors possible?
    }
  }

  page.on("response", addResponseSize)

  await page.setBypassServiceWorker(true)
  await page.setCacheEnabled(false)
  await page.goto(url, {
    waitUntil: "networkidle0",
  })
  

  rl.question('After interaction press "y" and enter to continue: ', async (answer) => {
    if (answer.toLowerCase() === "y") {
      // const perfEntries = JSON.parse(await page.evaluate(() => JSON.stringify(performance.getEntries())))
      // for (const entry of perfEntries) {
      //   console.log(entry.name, entry.transferSize, entry.encodedBodySize, entry.decodedBodySize)
      //   if (entry.transferSize) {
      //     totalWeight += Number(entry.encodedBodySize)
      //   }
      // }

      console.log("Total weight of network requests: ", totalWeight)
      page.off( 'response', addResponseSize );
      
      await browser.close()
      rl.close()
    }
  })
}

const urlToMeasure = process.argv[2]

if (!urlToMeasure) {
  console.error("Please provide a URL to measure")
  process.exit(1)
}

measureNetworkRequestWeights(urlToMeasure)

process.on("SIGINT", () => {
  console.log("Received SIGINT (Ctrl+C), closing process...")
  process.exit(0)
})
