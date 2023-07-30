import express from 'express';
import puppeteer from 'puppeteer';
import { extract } from '@extractus/article-extractor'

const app = express();
const port = 3000;

app.get('/', async (req, res) => {
    const url = req.query.url;

    if (!url) {
        return res.status(400).send('Invalid url');
    }

    let articleExtractorText = null;
    try {
        articleExtractorText = await extractArticle(url);
    } catch (err) {
        console.error("Error in extractArticle: ", err.message);
    }

    let chromeExtractedText = null;
    try {
        chromeExtractedText = await chromeExtract(url);
    } catch (err) {
        console.error("Error in chromeExtract: ", err.message);
    }

    if (articleExtractorText && articleExtractorText.content.length > 100 &&
        chromeExtractedText && articleExtractorText.content.length < chromeExtractedText.length) {
        return res.status(200).send(articleExtractorText.content);
    } else if (chromeExtractedText) {
        return res.status(200).send(chromeExtractedText);
    } else {
        return res.status(500).send('Both extractors failed.');
    }
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
});

async function extractArticle(url) {
    try {
        const data = await extract(url);
        return data;
    } catch (err) {
        console.error(err.message);
        return "";
    }
}

async function chromeExtract(url) {
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: { width: 820, height: 1180 },
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    });
    const page = await browser.newPage();

    try {
        const response = await page.goto(url, { waitUntil: 'networkidle0' });
        await page.waitForSelector('body', { timeout: 10000 });

        if (!response) {
            return "Failed to navigate to URL";
        }

        let status = response.status();
        if (status < 200 || status >= 300) {
            return await response.text();
        }

        await page.waitForSelector('body', { timeout: 5000 });
        const textContent = await page.evaluate(() => document.body.innerText);

        return textContent;

    } catch (e) {
        console.error(e.toString());
        return "";
    } finally {
        await page.close();
        await browser.close();
    }
}
