import { test, expect, addTodo, cleanDb } from './fixtures/collab'

test.beforeAll(() => {
  cleanDb()
})

test.describe('Persistence', () => {
  test('todos persist across page reload via IndexedDB', async ({ todoPage: page }) => {
    await addTodo(page, 'Persistent todo 1')
    await addTodo(page, 'Persistent todo 2')
    await expect(page.getByTestId('todo-item')).toHaveCount(2)

    // Reload within the same browser context (keeps IndexedDB)
    await page.reload()
    await page
      .getByTestId('connection-status')
      .filter({ hasText: 'Synced' })
      .waitFor({ timeout: 15_000 })

    await expect(page.getByTestId('todo-item')).toHaveCount(2)
    await expect(page.getByTestId('todo-text').filter({ hasText: 'Persistent todo 1' })).toBeVisible()
    await expect(page.getByTestId('todo-text').filter({ hasText: 'Persistent todo 2' })).toBeVisible()
  })

  test('username persists across reload via localStorage', async ({ todoPage: page }) => {
    // Double-click own name to edit
    const ownDot = page.getByTestId('presence-dot').filter({ hasText: '(you)' })
    await ownDot.locator('.name').dblclick()

    const nameInput = page.getByTestId('name-edit-input')
    await nameInput.fill('Persisted User')
    await nameInput.press('Enter')

    await expect(ownDot).toContainText('Persisted User')

    // Reload
    await page.reload()
    await page
      .getByTestId('connection-status')
      .filter({ hasText: 'Synced' })
      .waitFor({ timeout: 15_000 })

    await expect(
      page.getByTestId('presence-dot').filter({ hasText: '(you)' }),
    ).toContainText('Persisted User')
  })
})
