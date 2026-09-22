import { expect, test } from '@playwright/test';
import { openVisualFixture, visualFixtureStates } from './fixtures';

for (const state of visualFixtureStates) {
  test(`shared shell: ${state}`, async ({ page }) => {
    await openVisualFixture(page, state);
    await expect(page).toHaveScreenshot(`${state}.png`, {
      animations: 'disabled',
      caret: 'hide',
      fullPage: false,
      scale: 'css',
    });
  });
}
