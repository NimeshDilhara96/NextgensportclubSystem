const { Builder, By, until } = require('selenium-webdriver');
require('chromedriver');

(async function loginTest() {
  // Initialize the Chrome WebDriver
  let driver = await new Builder().forBrowser('chrome').build();

  // Track step results
  const results = [
    { step: "Navigate to login page", status: "❌" },
    { step: "Enter email", status: "❌" },
    { step: "Enter password", status: "❌" },
    { step: "Click Sign In", status: "❌" },
    { step: "Redirect to dashboard", status: "❌" },
  ];

  try {
    // 1. Navigate to the login page
    await driver.get('http://localhost:3000/login');
    results[0].status = "✅";

    // 2. Enter email
    await driver.wait(until.elementLocated(By.name('email')), 5000);
    await driver.findElement(By.name('email')).sendKeys('test@example.com');
    results[1].status = "✅";

    // 3. Enter password
    await driver.wait(until.elementLocated(By.name('password')), 5000);
    await driver.findElement(By.name('password')).sendKeys('TestPass1234#');
    results[2].status = "✅";

    // 4. Click the Sign In button
    await driver.wait(until.elementLocated(By.css('button[type="submit"]')), 5000);
    await driver.findElement(By.css('button[type="submit"]')).click();
    results[3].status = "✅";

    // 5. Wait for redirect to /dashboard (increased timeout to 15000 ms)
    await driver.wait(until.urlContains('/dashboard'), 15000);
    results[4].status = "✅";

    console.log('✅ Login test passed!');
  } catch (err) {
    console.error('❌ Login test failed:', err.message);
  } finally {
    // Print summary table
    console.log('\nLogin Test Summary:');
    console.table(results);
    // Quit the browser session
    await driver.quit();
  }
})();
