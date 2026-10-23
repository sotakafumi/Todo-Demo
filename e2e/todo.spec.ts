import type { Page } from '@playwright/test';
import {
  addTodo,
  expect,
  expectBoard,
  openApp,
  reloadApp,
  seedTodos,
  storedTodos,
  test,
} from './fixtures.ts';

test.beforeEach(async ({ page }) => {
  await openApp(page);
});

test.describe('adding', () => {
  test('starts empty with the input focused and 今すぐやる chosen', async ({ page }) => {
    await expect(page.getByText('TODOはまだありません')).toBeVisible();
    await expect(page.getByText(/^残り/)).toHaveCount(0);
    await expect(page.getByLabel('新しいTODO')).toBeFocused();
    await expect(page.getByRole('radio', { name: '今すぐやる' })).toBeChecked();
  });

  test('adds into the chosen category and keeps the form ready for the next one', async ({ page }) => {
    const input = page.getByLabel('新しいTODO');
    await addTodo(page, '牛乳を買う');
    await expectBoard(page, [['今すぐやる', '牛乳を買う']]);
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
    await expect(page.getByText('残り 1 件')).toBeVisible();

    await addTodo(page, '見積もりの返事', '連絡待ち');
    await expectBoard(page, [
      ['今すぐやる', '牛乳を買う'],
      ['連絡待ち', '見積もりの返事'],
    ]);
    await expect(page.getByRole('radio', { name: '連絡待ち' })).toBeChecked();
  });

  test('ignores a blank title', async ({ page }) => {
    await addTodo(page, '   ');
    await expect(page.getByText('TODOはまだありません')).toBeVisible();
    expect(await storedTodos(page)).toBeNull();
  });
});

test.describe('changing the category', () => {
  test('moves the todo to its new group and keeps focus on its select', async ({ page }) => {
    await addTodo(page, '牛乳を買う');
    await addTodo(page, '見積もりの返事', '連絡待ち');
    const select = page.getByRole('combobox', { name: '「牛乳を買う」の分類' });
    await select.selectOption({ label: 'プロジェクト' });
    await expectBoard(page, [
      ['連絡待ち', '見積もりの返事'],
      ['プロジェクト', '牛乳を買う'],
    ]);
    await expect(select).toBeFocused();
  });
});

test.describe('completing', () => {
  test('updates the remaining count and the clear button', async ({ page }) => {
    await addTodo(page, '牛乳を買う');
    await addTodo(page, '見積もりの返事');
    const checkbox = page.getByRole('checkbox', { name: '「見積もりの返事」を完了にする' });
    const clear = page.getByRole('button', { name: '完了済みを削除' });

    await checkbox.check();
    await expectBoard(page, [['今すぐやる', '牛乳を買う', '見積もりの返事 ✓']]);
    await expect(page.getByText('残り 1 件')).toBeVisible();
    await expect(clear).toBeVisible();

    await checkbox.uncheck();
    await expect(page.getByText('残り 2 件')).toBeVisible();
    await expect(clear).toHaveCount(0);
  });
});

test.describe('editing', () => {
  const editor = (page: Page) => page.getByRole('textbox', { name: 'TODOを編集' });

  test('Enter saves and returns focus to ✎ without reopening the editor', async ({ page }) => {
    await addTodo(page, '牛乳を買う');
    await page.getByRole('button', { name: '「牛乳を買う」を編集' }).click();
    await expect(editor(page)).toBeFocused();
    const selection = await editor(page).evaluate((field: HTMLInputElement) => [
      field.selectionStart,
      field.selectionEnd,
    ]);
    expect(selection).toEqual([0, '牛乳を買う'.length]);

    await editor(page).fill('豆乳を買う');
    await editor(page).press('Enter');
    await expectBoard(page, [['今すぐやる', '豆乳を買う']]);
    await expect(editor(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: '「豆乳を買う」を編集' })).toBeFocused();
    expect((await storedTodos(page))[0].title).toBe('豆乳を買う');
  });

  test('Escape cancels and returns focus to ✎', async ({ page }) => {
    await addTodo(page, '牛乳を買う');
    const editButton = page.getByRole('button', { name: '「牛乳を買う」を編集' });
    await editButton.focus();
    await editButton.press('Enter');
    await expect(editor(page)).toBeFocused();

    await editor(page).fill('書きかけ');
    await editor(page).press('Escape');
    await expectBoard(page, [['今すぐやる', '牛乳を買う']]);
    await expect(editButton).toBeFocused();
  });

  test('Enter that confirms an IME conversion does not save', async ({ page }) => {
    await addTodo(page, '牛乳を買う');
    await page.getByRole('button', { name: '「牛乳を買う」を編集' }).click();
    await editor(page).fill('ぎゅうにゅう');
    // Chromium marks the event with isComposing; Safari reports keyCode 229 instead.
    await editor(page).dispatchEvent('keydown', { key: 'Enter', isComposing: true });
    await editor(page).dispatchEvent('keydown', { key: 'Enter', keyCode: 229 });
    await expect(editor(page)).toBeVisible();
    expect((await storedTodos(page))[0].title).toBe('牛乳を買う');
  });

  test('double-click opens the editor and leaving it saves', async ({ page }) => {
    await addTodo(page, '牛乳を買う');
    await page.getByText('牛乳を買う', { exact: true }).dblclick();
    await expect(editor(page)).toBeFocused();

    await editor(page).fill('オーツミルクを買う');
    await page.getByLabel('新しいTODO').click();
    await expectBoard(page, [['今すぐやる', 'オーツミルクを買う']]);
    await expect(page.getByLabel('新しいTODO')).toBeFocused();
  });

  test('a blank title deletes the todo', async ({ page }) => {
    await addTodo(page, '牛乳を買う');
    await page.getByRole('button', { name: '「牛乳を買う」を編集' }).click();
    await editor(page).fill('');
    await editor(page).press('Enter');
    await expect(page.getByText('TODOはまだありません')).toBeVisible();
    expect(await storedTodos(page)).toEqual([]);
  });
});

test.describe('removing and filtering', () => {
  test('× removes the todo', async ({ page }) => {
    await addTodo(page, '牛乳を買う');
    await addTodo(page, '見積もりの返事');
    await page.getByRole('button', { name: '「牛乳を買う」を削除' }).click();
    await expectBoard(page, [['今すぐやる', '見積もりの返事']]);
  });

  test('filters by completion and clears completed todos', async ({ page }) => {
    await addTodo(page, '牛乳を買う');
    await addTodo(page, '見積もりの返事', '連絡待ち');
    await page.getByRole('checkbox', { name: '「見積もりの返事」を完了にする' }).check();
    const filter = (name: string) => page.getByRole('button', { name, exact: true });

    await filter('未完了').click();
    await expectBoard(page, [['今すぐやる', '牛乳を買う']]);
    await expect(filter('未完了')).toHaveAttribute('aria-pressed', 'true');
    await expect(filter('すべて')).toHaveAttribute('aria-pressed', 'false');

    await filter('完了').click();
    await expectBoard(page, [['連絡待ち', '見積もりの返事 ✓']]);

    await page.getByRole('button', { name: '完了済みを削除' }).click();
    await expectBoard(page, []);
    await expect(page.getByText('該当するTODOはありません')).toBeVisible();
    await expect(page.getByRole('button', { name: '完了済みを削除' })).toHaveCount(0);

    await filter('すべて').click();
    await expectBoard(page, [['今すぐやる', '牛乳を買う']]);
  });
});

test.describe('persistence', () => {
  test('todos survive a reload', async ({ page }) => {
    await addTodo(page, '牛乳を買う');
    await addTodo(page, '見積もりの返事', '連絡待ち');
    await page.getByRole('checkbox', { name: '「見積もりの返事」を完了にする' }).check();
    await reloadApp(page);
    await expectBoard(page, [
      ['今すぐやる', '牛乳を買う'],
      ['連絡待ち', '見積もりの返事 ✓'],
    ]);
  });

  test('saves todos with randomUUID ids on a secure context', async ({ page }) => {
    await addTodo(page, '牛乳を買う');
    expect(await storedTodos(page)).toEqual([
      {
        id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        title: '牛乳を買う',
        completed: false,
        category: 'now',
      },
    ]);
  });

  test('loads data saved by older versions and drops malformed entries', async ({ page }) => {
    await seedTodos(page, [
      { id: 'a', title: '分類なし', completed: false },
      { id: 'b', title: '不明な分類', completed: true, category: 'bogus' },
      { id: 'c', title: 42, completed: false },
      null,
    ]);
    await expectBoard(page, [['今すぐやる', '分類なし', '不明な分類 ✓']]);
  });

  test('falls back to getRandomValues ids outside a secure context', async ({ page, baseURL }) => {
    const url = new URL(baseURL!);
    url.hostname = 'todo.test';
    await openApp(page, url.href);
    expect(await page.evaluate(() => isSecureContext)).toBe(false);

    await addTodo(page, 'LANから追加');
    expect((await storedTodos(page))[0].id).toMatch(/^[0-9a-f]{32}$/);
  });
});
