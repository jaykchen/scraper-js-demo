const puppeteer = require('puppeteer');
const pdfParse = require('pdf-parse');
const { extractFromHtml } = require('@extractus/article-extractor');
const { htmlToText } = require('html-to-text');

async function text_from_ensemble_methods(url) {
    console.log(`Starting the browser and going to ${url}...`);

    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: { width: 820, height: 1180 },
        // executablePath: '/path/to/your/chrome',
    });

    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.waitForSelector('body', { timeout: 10000 });

    const page_html_as_str = await page.content();
    const page_html_cleaned_obj = await extractFromHtml(page_html_as_str, url);
    const readability_text = htmlToText(page_html_cleaned_obj.content, {
        wordwrap: 80,
        hideLinkHrefIfSameAsText: true,
    });

    const pdfOptions = {
        format: 'Letter',
        width: '11in',
        height: '17in',
        landscape: false,
        displayHeaderFooter: false,
        printBackground: false,
        margin: {
            top: "0.1in",
            right: "0.1in",
            bottom: "0.1in",
            left: "0.1in"
        },
        preferCSSPageSize: false,
    };

    const pdf_buffer = await page.pdf(pdfOptions);

    const data = await pdfParse(pdf_buffer);
    const text_from_page_virtual_pdf = data.text;

    if (readability_text.length > 400 && readability_text.length < text_from_page_virtual_pdf.length) {
        console.log(`Text extracted with Readability:`);
        console.log(readability_text);

        return readability_text;
    } else {
        console.log(`Text extracted from the PDF:`);
        console.log(data.text);
        return data.text;
    }
    await browser.close();
}

// text_from_ensemble_methods('https://www.npmjs.com/package/html-to-text')
text_from_ensemble_methods('https://github.com/amiiiiii830/')
    .catch(err => {
        console.error(`An error occurred: ${err}`);
    });
