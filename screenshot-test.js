const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  
  // Screenshot 1: Initial closed state
  await page.screenshot({ path: '/tmp/comic-1-closed.png', fullPage: false });
  console.log('Screenshot 1: Closed book saved');
  
  // Click on the book cover to open it
  await page.click('.stf__parent');
  await page.waitForTimeout(1500); // Wait for flip animation
  
  // Screenshot 2: After first flip
  await page.screenshot({ path: '/tmp/comic-2-opened.png', fullPage: false });
  console.log('Screenshot 2: After opening saved');
  
  // Click to flip another page
  await page.click('.stf__parent');
  await page.waitForTimeout(400); // Capture mid-flip
  
  // Screenshot 3: During page flip
  await page.screenshot({ path: '/tmp/comic-3-flipping.png', fullPage: false });
  console.log('Screenshot 3: During flip saved');
  
  await page.waitForTimeout(1000);
  
  // Screenshot 4: After flip complete
  await page.screenshot({ path: '/tmp/comic-4-flipped.png', fullPage: false });
  console.log('Screenshot 4: After flip saved');
  
  await browser.close();
  console.log('Done! Screenshots saved to /tmp/');
})();
