const { Builder, By, until } = require('selenium-webdriver');
require('chromedriver');

function getTomorrowDaySelector() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  // ReactDatePicker days have aria-label="choose Monday, July 22nd, 2025"
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const label = tomorrow.toLocaleDateString('en-US', options);
  return `[aria-label="choose ${label}"]`;
}

function getTomorrowDayNumber() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.getDate();
}

(async function bookingTest() {
  let driver = await new Builder().forBrowser('chrome').build();

  const results = [
    { step: "Login as user", status: "❌" },
    { step: "Navigate to facilities page", status: "❌" },
    { step: "Click Book Now on first facility", status: "❌" },
    { step: "Select start and end time", status: "❌" },
    { step: "Submit booking form", status: "❌" },
    { step: "Booking success message appears", status: "❌" },
  ];

  try {
    // 1. Login as user
    await driver.get('http://localhost:3000/login');
    await driver.wait(until.elementLocated(By.name('email')), 5000);
    await driver.findElement(By.name('email')).sendKeys('test@example.com');
    await driver.findElement(By.name('password')).sendKeys('TestPass1234#');
    await driver.findElement(By.css('button[type="submit"]')).click();
    await driver.wait(until.urlContains('/dashboard'), 10000);
    results[0].status = "✅";

    // 2. Navigate to facilities page via sidebar link
    await driver.wait(until.elementLocated(By.css('.sidebar-nav')), 5000);
    const facilitiesLink = await driver.findElement(By.xpath("//span[contains(text(),'Sports & Facilities')]/ancestor::a"));
    await facilitiesLink.click();
    await driver.wait(until.elementLocated(By.xpath("//button[contains(.,'Book Now')]")), 5000);
    results[1].status = "✅";

    // 3. Click Book Now on the first available facility
    const bookNowBtn = await driver.findElement(By.xpath("//button[contains(.,'Book Now')]"));
    await bookNowBtn.click();
    await driver.wait(until.elementLocated(By.css("form")), 5000);
    results[2].status = "✅";

    // 4. Select start and end time using UI interaction with ReactDatePicker

    // --- Start Time: Tomorrow, 09:30 AM ---
    const startInput = await driver.findElement(By.id('startTime'));
    await startInput.click();

    const tomorrowSelector = getTomorrowDaySelector();
    try {
      await driver.wait(until.elementLocated(By.css(tomorrowSelector)), 3000);
      await driver.findElement(By.css(tomorrowSelector)).click();
    } catch {
      const dayNum = getTomorrowDayNumber();
      await driver.wait(until.elementLocated(By.xpath(`//div[contains(@class,'react-datepicker__day') and text()='${dayNum}']`)), 3000);
      await driver.findElement(By.xpath(`//div[contains(@class,'react-datepicker__day') and text()='${dayNum}']`)).click();
    }

    // Now select 09:30 AM from the time list
    await driver.wait(until.elementLocated(By.xpath("//li[contains(text(),'09:30')]")), 3000);
    await driver.findElement(By.xpath("//li[contains(text(),'09:30')]")).click();

    // --- End Time: Tomorrow, 10:30 AM ---
    const endInput = await driver.findElement(By.id('endTime'));
    await endInput.click();

    try {
      await driver.wait(until.elementLocated(By.css(tomorrowSelector)), 3000);
      await driver.findElement(By.css(tomorrowSelector)).click();
    } catch {
      const dayNum = getTomorrowDayNumber();
      await driver.wait(until.elementLocated(By.xpath(`//div[contains(@class,'react-datepicker__day') and text()='${dayNum}']`)), 3000);
      await driver.findElement(By.xpath(`//div[contains(@class,'react-datepicker__day') and text()='${dayNum}']`)).click();
    }

    // Now select 10:30 AM from the time list
    await driver.wait(until.elementLocated(By.xpath("//li[contains(text(),'10:30')]")), 3000);
    await driver.findElement(By.xpath("//li[contains(text(),'10:30')]")).click();

    results[3].status = "✅";

    // 5. Submit booking form
    const submitBtn = await driver.findElement(By.css("form button[type='submit']"));
    await driver.wait(async () => await submitBtn.isEnabled(), 3000);
    await submitBtn.click();
    results[4].status = "✅";

    // 6. Wait for booking success message
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(),'Facility booked successfully')]")), 10000);
    results[5].status = "✅";

    console.log('✅ Booking test passed!');
  } catch (err) {
    console.error('❌ Booking test failed:', err.message);
  } finally {
    console.log('\nBooking Test Summary:');
    console.table(results);
    await driver.quit();
  }
})();