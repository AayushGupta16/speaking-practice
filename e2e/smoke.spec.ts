import { expect, test } from '@playwright/test';

test('records, notes, analyzes, saves, and reopens a custom-topic rep', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Practice speaking under pressure.' })).toBeVisible();
  await page.getByPlaceholder(/Specific topic\/event/i).fill('YC interview');
  await page.getByRole('button', { name: 'Generate prompt' }).click();
  await expect(page.getByText(/Speak for 60-120 seconds about YC interview/i)).toBeVisible();

  await page.getByRole('button', { name: 'Start recording' }).click();
  await expect(page.getByText(/Recording\./i)).toBeVisible();
  await page.getByPlaceholder(/Take notes/i).fill('Opened clearly, gave two examples, needs tighter ending.');
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Stop' }).click();

  await expect(page.getByText(/Recording ready/i)).toBeVisible();
  await page.getByLabel('Clarity').selectOption('Excellent');
  await page.getByLabel('Depth and substance').selectOption('Strong');
  await expect(page.getByText(/Self grade:/)).toBeVisible();

  await page.getByRole('button', { name: /Analyze with Gemini/i }).click();
  await expect(page.getByRole('heading', { name: 'AI coaching' })).toBeVisible();
  await expect(page.getByText(/Local coaching fallback/i)).toBeVisible();
  await expect(page.getByText(/Depth\/substance:/i)).toBeVisible();

  await page.getByRole('button', { name: 'Save rep' }).click();
  await expect(page.getByText(/Saved locally/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Saved sessions' })).toBeVisible();

  await page.reload();
  await expect(page.getByText(/YC interview/i)).toBeVisible();
  await page.getByText(/Speak for 60-120 seconds about YC interview/i).last().click();
  await expect(page.getByRole('heading', { name: 'Session detail' })).toBeVisible();
  await expect(page.getByText(/Notes: Opened clearly/i)).toBeVisible();
  await page.getByRole('button', { name: 'Use as reference' }).click();
  await expect(page.getByText('Reference recording selected', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Redo this prompt' }).click();
  await expect(page.getByText(/Try to beat your prior rep/i)).toBeVisible();

  await page.getByRole('button', { name: 'Start recording' }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.getByText(/Recording ready/i)).toBeVisible();
  await page.getByRole('button', { name: /Analyze with Gemini/i }).click();
  await expect(page.getByText(/Compared to reference/i)).toBeVisible();
  await expect(page.getByText(/Reference context received/i)).toBeVisible();
});
