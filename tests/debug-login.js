const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    executablePath: 'C:/Users/Admin/AppData/Local/ms-playwright/chromium-1208/chrome-win64/chrome.exe'
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log('CONSOLE:', msg.type(), msg.text());
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  
  try {
    console.log('Navigating to login page...');
    await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle', timeout: 30000 });
    
    console.log('Waiting for app to load...');
    await page.waitForTimeout(5000);
    
    // Get the app content
    const appHtml = await page.locator('#app').innerHTML();
    console.log('App HTML length:', appHtml.length);
    console.log('App HTML preview:', appHtml.substring(0, 500));
    
    // Try to find email input
    const emailInput = page.locator('#email');
    const count = await emailInput.count();
    console.log('Email input count:', count);
    
    if (count > 0) {
      console.log('Email input is visible:', await emailInput.isVisible());
    } else {
      // Try generic selectors
      const inputs = await page.locator('input').count();
      console.log('Total input count:', inputs);
      
      const allInputs = await page.locator('input').all();
      for (let i = 0; i < allInputs.length; i++) {
        const input = allInputs[i];
        const id = await input.getAttribute('id');
        const type = await input.getAttribute('type');
        const placeholder = await input.getAttribute('placeholder');
        console.log(`Input ${i}: id=${id}, type=${type}, placeholder=${placeholder}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();
