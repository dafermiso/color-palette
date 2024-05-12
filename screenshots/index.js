const playwright = require("playwright");
const compareImages = require("resemblejs/compareImages");
const config = require("./config.json");
const fs = require("fs");

const { viewportHeight, viewportWidth, browsers, options } = config;

async function executeTest() {
  if (browsers.length === 0) {
    return;
  }
  let resultInfo = {};
  let datetime = new Date().toISOString().replace(/:/g, ".");
  for (b of browsers) {
    if (!b in ["chromium", "webkit", "firefox"]) {
      return;
    }
    if (!fs.existsSync(`./results/${datetime}`)) {
      fs.mkdirSync(`./results/${datetime}`, { recursive: true });
    }
    //Launch the current browser context
    const browser = await playwright[b].launch({
      headless: true,
      viewport: { width: viewportWidth, height: viewportHeight },
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(config.url);
    await page.screenshot({ path: `./results/${datetime}/before-${b}.png` });
    await page.click("#generate");
    await page.screenshot({ path: `./results/${datetime}/after-${b}.png` });
    await browser.close();

    const data = await compareImages(
      fs.readFileSync(`./results/${datetime}/before-${b}.png`),
      fs.readFileSync(`./results/${datetime}/after-${b}.png`),
      options
    );
    resultInfo[b] = {
      isSameDimensions: data.isSameDimensions,
      dimensionDifference: data.dimensionDifference,
      rawMisMatchPercentage: data.rawMisMatchPercentage,
      misMatchPercentage: data.misMatchPercentage,
      diffBounds: data.diffBounds,
      analysisTime: data.analysisTime,
    };
    fs.writeFileSync(
      `./results/${datetime}/compare-${b}.png`,
      data.getBuffer()
    );
  }

  console.log(
    "------------------------------------------------------------------------------------"
  );
  console.log("Execution finished. Check the report under the results folder");
  return resultInfo;
}
(async () => console.log(await executeTest()))();
