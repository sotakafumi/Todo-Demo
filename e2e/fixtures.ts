import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { STORAGE_KEY } from '../src/lib/storage.ts';

// Every test fails on console errors or warnings and on uncaught exceptions. That is where
// hydration mismatches and React warnings show up.
export const test = base.extend<{ consoleProblems: string[] }>({
  consoleProblems: [
    async ({ page }, use) => {
      const problems: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error' || message.type() === 'warning') problems.push(message.text());
      });
      page.on('pageerror', (error) => problems.push(error.message));
      await use(problems);
      expect(problems).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

// The board renders only after the todos are read from localStorage, i.e. after hydration.
// Waiting for it also keeps tests from typing into the form before React has taken it over.
export async function openApp(page: Page, url = '/') {
  await page.goto(url);
  await expect(page.locator('.empty, .footer')).toBeVisible();
}

export async function reloadApp(page: Page) {
  await page.reload();
  await expect(page.locator('.empty, .footer')).toBeVisible();
}

export async function addTodo(page: Page, title: string, category?: string) {
  if (category) await page.getByRole('radio', { name: category }).check();
  const input = page.getByLabel('新しいTODO');
  await input.fill(title);
  await input.press('Enter');
}

export async function seedTodos(page: Page, todos: unknown[]) {
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    [STORAGE_KEY, JSON.stringify(todos)],
  );
  await reloadApp(page);
}

export async function storedTodos(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), STORAGE_KEY);
}

// The board as one [category label, ...titles] entry per visible group, with " ✓" after
// completed titles, e.g. [['今すぐやる', '牛乳を買う ✓']]. Retries until it matches, like
// other assertions.
export async function expectBoard(page: Page, expected: string[][]) {
  await expect
    .poll(() =>
      page.locator('section.group').evaluateAll((sections) =>
        sections.map((section) => [
          section.querySelector('h2')?.firstChild?.textContent ?? '',
          ...Array.from(section.querySelectorAll('li'), (item) => {
            const title = item.querySelector('.title')?.textContent ?? '(editing)';
            return item.classList.contains('completed') ? `${title} ✓` : title;
          }),
        ]),
      ),
    )
    .toEqual(expected);
}
