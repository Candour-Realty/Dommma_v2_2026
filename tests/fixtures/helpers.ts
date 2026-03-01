import { Page, expect } from '@playwright/test';

export async function waitForAppReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
}

export async function dismissToasts(page: Page) {
  await page.addLocatorHandler(
    page.locator('[data-sonner-toast], .Toastify__toast, [role="status"].toast, .MuiSnackbar-root'),
    async () => {
      const close = page.locator('[data-sonner-toast] [data-close], [data-sonner-toast] button[aria-label="Close"], .Toastify__close-button, .MuiSnackbar-root button');
      await close.first().click({ timeout: 2000 }).catch(() => {});
    },
    { times: 10, noWaitAfter: true }
  );
}

export async function checkForErrors(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const errorElements = Array.from(
      document.querySelectorAll('.error, [class*="error"], [id*="error"]')
    );
    return errorElements.map(el => el.textContent || '').filter(Boolean);
  });
}

export async function openNovaChat(page: Page) {
  const chatButton = page.getByTestId('nova-chat-button');
  await expect(chatButton).toBeVisible();
  await chatButton.click();
  await expect(page.getByTestId('nova-chat-modal')).toBeVisible();
}

export async function sendNovaChatMessage(page: Page, message: string) {
  const input = page.getByTestId('nova-input');
  await input.fill(message);
  await page.getByTestId('nova-send-button').click();
}

export async function waitForNovaResponse(page: Page, timeout: number = 30000) {
  // Wait for loading indicator to appear and disappear
  const messagesContainer = page.getByTestId('nova-messages-container');
  await expect(messagesContainer.locator('text=Nova is thinking...')).toBeHidden({ timeout });
}

export async function closeNovaChat(page: Page) {
  await page.getByTestId('nova-close-button').click();
  await expect(page.getByTestId('nova-chat-modal')).toBeHidden();
}
