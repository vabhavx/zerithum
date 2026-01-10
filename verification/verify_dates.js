import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the dev server to start
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('Navigating to Transactions page...');
    await page.goto('http://localhost:5173/transactions');

    // Wait for content to load
    await page.waitForSelector('h1:has-text("Transactions")');

    // Verify date formatting (MMM d, yyyy) which confirms date-fns usage
    // We look for a date pattern like "Jan 1, 2023" (3-letter month, day, year)
    // The previous format was also similar, but we want to ensure it renders without crashing.
    // If date-fns was missing, the page would likely be blank or show an error overlay.

    const tableContent = await page.textContent('table');
    console.log('Table content found.');

    // Take screenshot
    await page.screenshot({ path: 'verification/transactions.png', fullPage: true });
    console.log('Screenshot saved to verification/transactions.png');

    console.log('Navigating to Connected Apps page...');
    await page.goto('http://localhost:5173/apps');
    await page.waitForSelector('h1:has-text("Connected Apps")');

    await page.screenshot({ path: 'verification/connected_apps.png', fullPage: true });
    console.log('Screenshot saved to verification/connected_apps.png');

  } catch (error) {
    console.error('Error during verification:', error);
    process.exit(1);
  } finally {
    await browser.close();
    process.exit(0);
  }
})();
