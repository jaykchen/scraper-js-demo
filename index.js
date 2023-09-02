import express from 'express';
import puppeteer from 'puppeteer';
import { extractFromHtml } from '@extractus/article-extractor'
import { JSDOM } from 'jsdom';
import fs from 'fs';

// Load environment variables from env.json file
const env = JSON.parse(fs.readFileSync('env.json', 'utf-8'));

const app = express();
const port = 3000;

// Parse the LOGIN_CREDENTIALS from env.json into an object
const loginCredentials = env.LOGIN_CREDENTIALS || [];

app.get('/', async (req, res) => {
    const url = req.query.url;

    if (!url) {
        return res.status(400).send('Invalid url');
    }

    let pageHTML;
    let textContent;

    // Find matching credentials
    const creds = loginCredentials.find(creds => url.includes(creds.url));

    if (creds) {
        // Login using credentials if they exist
        try {
            const browser = await puppeteer.launch({
                headless: true,
                defaultViewport: { width: 820, height: 1180 },
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
                executablePath: '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta',
            });
            const page = await browser.newPage();
            await page.goto(`https://${creds.url}/login`, { waitUntil: 'networkidle0' });
            await page.type('#login_field', creds.username); // Enter your username
            await page.type('#password', creds.password); // Enter your password from env.json
            await Promise.all([
                page.waitForNavigation(), // The promise resolves after navigation has finished
                page.click('.btn-primary'), // Clicking the link will indirectly cause a navigation
            ]);
            pageHTML = await fetchPageHTML(url, page);

            const dom = new JSDOM(pageHTML);
            const codeLinesDiv = dom.window.document.querySelector('.react-code-lines');

            if (codeLinesDiv) {
                const codeLines = Array.from(codeLinesDiv.querySelectorAll('[data-code-text]'))
                    .map(span => span.getAttribute('data-code-text'))
                    .join('');
                console.log(codeLines);
            } else {
                console.log('Cannot find the code lines wrapper');
            }

            // textContent = await page.evaluate(() => document.body.innerText);
            // textContent = await page.evaluate(() => {
            //     let codeLines = Array.from(document.querySelectorAll('span[data-code-text]'));
            //     return codeLines.map(line => line.getAttribute('data-code-text')).join(' ');
            // });

            // console.log(textContent);

        } catch (err) {
            console.error('Login failed:', err);
        }
    }

    let articleExtractorText = null;
    try {
        const dom = new JSDOM(pageHTML);

    } catch (err) {
        console.error("Error in extractArticle: ", err.message);
    }


});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
});

async function extractArticle(url, doc) {
    try {
        const data = await extractFromHtml(doc, url);
        return data;
    } catch (err) {
        console.error(err.message);
        return "";
    }
}

async function fetchPageHTML(url, page) {
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
        const htmlContent = await page.evaluate(() => document.documentElement.outerHTML);
        return htmlContent;
    } catch (e) {
        console.error(e.toString());
        return "";
    } finally {
        // await page.close();
        // await browser.close();
    }
}


// userDataDir: '/Users/jaykchen/Library/Application Support/Google/Chrome/Default',
// userDataDir: '/Users/jaykchen/Library/Application Support/Google/Chrome Beta/Default',
// userDataDir: '/Users/jaykchen/Library/Application Support/Google/Chrome Beta/',
// args: ['--no-sandbox', '--disable-setuid-sandbox',
//     '--profile-directory=/Users/jaykchen/Library/Application Support/Google/Chrome Beta/Profile 1'],
// args: ['--no-sandbox', '--disable-setuid-sandbox',
//     '--profile-directory=/Users/jaykchen/Library/Application Support/Google/Chrome Beta/Profile 1'],
// userDataDir: '/Users/jaykchen/Library/Application Support/Google/Chrome/jaykchen@gmail.com',
// defaultViewport: { width: 820, height: 1180 },
// userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
//     executablePath: '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta',
//         // executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
