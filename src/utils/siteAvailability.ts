import type { Page } from '@playwright/test';

export const PUBLIC_SITE_QUEUE_FULL_PATTERN =
  /This website is under heavy load\s*\(queue full\)|too many people are accessing this website/i;

export function isPublicSiteQueueFullText(text: string): boolean {
  return PUBLIC_SITE_QUEUE_FULL_PATTERN.test(text);
}

export async function waitForProductGridOrQueueFull(page: Page): Promise<boolean> {
  const queueFullMessage = page.getByText(PUBLIC_SITE_QUEUE_FULL_PATTERN);
  await page.locator('.features_items').or(queueFullMessage).first().waitFor({ state: 'visible' });
  return queueFullMessage.isVisible();
}
