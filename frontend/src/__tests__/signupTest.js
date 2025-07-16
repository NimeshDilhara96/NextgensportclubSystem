const { Builder, By, until } = require('selenium-webdriver');
require('chromedriver');

(async function signupTest() {
  const driver = await new Builder().forBrowser('chrome').build();
  // Track step results
  const results = [
    { step: "Open signup page", status: "❌" },
    { step: "Fill name", status: "❌" },
    { step: "Set DOB", status: "❌" },
    { step: "Set gender", status: "❌" },
    { step: "Fill email", status: "❌" },
    { step: "Fill contact", status: "❌" },
    { step: "Fill password", status: "❌" },
    { step: "Set role", status: "❌" },
    { step: "Agree to terms", status: "❌" },
    { step: "Submit form", status: "❌" },
    { step: "OTP input appears", status: "❌" },
  ];
  try {
    await driver.get('http://localhost:3000/signup');
    results[0].status = "✅";

    await driver.findElement(By.id('name')).sendKeys('Test User');
    results[1].status = "✅";

    await driver.findElement(By.id('dob')).sendKeys('01/01/2000');
    results[2].status = "✅";


    // Wait a second for age to calculate (React hook)
    await driver.sleep(1000);

    await driver.findElement(By.id('gender')).sendKeys('Male');
    results[3].status = "✅";

    let emailField = await driver.findElement(By.id('email'));
    for (const char of 'testuser@example.com') {
      await emailField.sendKeys(char);
      await driver.sleep(50);
    }
    results[4].status = "✅";

    let contactField = await driver.findElement(By.id('contact'));
    for (const char of '0712345678') {
      await contactField.sendKeys(char);
      await driver.sleep(50);
    }
    results[5].status = "✅";

    await driver.findElement(By.id('password')).sendKeys('TestPass123');
    results[6].status = "✅";

    await driver.findElement(By.id('role')).sendKeys('member');
    results[7].status = "✅";

    const checkbox = await driver.findElement(By.css('input[type="checkbox"]'));
    await driver.executeScript("arguments[0].scrollIntoView(true);", checkbox);
    await driver.wait(until.elementIsVisible(checkbox), 5000);
    await driver.wait(until.elementIsEnabled(checkbox), 5000);
    await checkbox.click();
    results[8].status = "✅";

    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
    await driver.executeScript("arguments[0].scrollIntoView(true);", submitBtn);
    await driver.wait(until.elementIsVisible(submitBtn), 5000);
    await driver.wait(until.elementIsEnabled(submitBtn), 5000);
    await submitBtn.click();
    results[9].status = "✅";

    await driver.wait(until.elementLocated(By.id('otp')), 100000);
    results[10].status = "✅";

    console.log('✅ Signup form submitted, OTP step loaded!');
  } catch (err) {
    console.error('❌ Signup test failed:', err.message);
  } finally {
    // Print summary table
    console.log('\nSignup Test Summary:');
    console.table(results);
    await driver.quit();
  }
})();
