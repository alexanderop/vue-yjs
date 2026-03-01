import { test, expect, cleanDb } from './fixtures/collab'

test.beforeAll(() => {
  cleanDb()
})

test.describe('Presence', () => {
  test('single user sees own presence dot with "(you)"', async ({ todoPage: page }) => {
    const dot = page.getByTestId('presence-dot')
    await expect(dot).toHaveCount(1)
    await expect(dot).toContainText('(you)')
  })

  test('two users see two presence dots', async ({ twoUsers: { pageA, pageB } }) => {
    await expect(pageA.getByTestId('presence-dot')).toHaveCount(2)
    await expect(pageB.getByTestId('presence-dot')).toHaveCount(2)
  })

  test('user edits username, other user sees updated name', async ({ twoUsers: { pageA, pageB } }) => {
    // Double-click own name on pageA to edit
    const ownDot = pageA.getByTestId('presence-dot').filter({ hasText: '(you)' })
    await ownDot.locator('.name').dblclick()

    const nameInput = pageA.getByTestId('name-edit-input')
    await nameInput.fill('Alice')
    await nameInput.press('Enter')

    // User B should see the updated name
    await expect(pageB.getByTestId('presence-dot').filter({ hasText: 'Alice' })).toBeVisible()
  })

  test('connection status shows "Synced" after load', async ({ todoPage: page }) => {
    await expect(page.getByTestId('connection-status')).toHaveText('Synced')
  })
})
