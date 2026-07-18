async (page) => {
  await page.goto('http://127.0.0.1:8082/index.html');
  await page.waitForTimeout(500);
  await page.locator('#length').fill('');
  await page.locator('#width').fill('');
  await page.locator('#height').fill('');
  await page.locator('#quantity').fill('');
  await page.waitForTimeout(200);
  await page.locator('#length').fill('200');
  await page.locator('#width').fill('150');
  await page.locator('#height').fill('80');
  await page.waitForTimeout(200);
  await page.locator('#quantity').fill('100');
  await page.locator('.section-title').first().click();
  await page.waitForTimeout(500);
  var price = await page.locator('#totalPrice').textContent();
  var qtyVal = await page.locator('#quantity').inputValue();
  return { qty: qtyVal, price: price };
}
