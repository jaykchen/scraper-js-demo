const puppeteer = require('puppeteer');

async function text_from_ensemble_methods(url) {
    console.log(`Starting the browser and going to ${url}...`);

    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: { width: 820, height: 1180 },
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    });

    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.waitForSelector('body', { timeout: 10000 });

    const textContent = await page.evaluate(() => document.body.innerText);

    console.log(textContent);
    await browser.close();
}

// text_from_ensemble_methods('https://github.com/amiiiiii830/')
text_from_ensemble_methods('https://nature.com/articles/d41586-023-01980-4')
    .catch(err => {
        console.error(`An error occurred: ${err}`);
    });
