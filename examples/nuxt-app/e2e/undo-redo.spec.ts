import { test, expect, addTodo, cleanDb } from './fixtures/collab'

test.beforeAll(() => {
  cleanDb()
})

test.describe('Undo / Redo', () => {
  test('click undo removes last added todo', async ({ todoPage: page }) => {
    await addTodo(page, 'Undo me')
    await expect(page.getByTestId('todo-item')).toHaveCount(1)

    await page.getByTestId('undo-button').click()

    await expect(page.getByTestId('todo-item')).toHaveCount(0)
  })

  test('click redo restores undone todo', async ({ todoPage: page }) => {
    await addTodo(page, 'Redo me')
    await page.getByTestId('undo-button').click()
    await expect(page.getByTestId('todo-item')).toHaveCount(0)

    await page.getByTestId('redo-button').click()

    await expect(page.getByTestId('todo-item')).toHaveCount(1)
    await expect(page.getByTestId('todo-text')).toHaveText('Redo me')
  })

  test('undo button disabled when nothing to undo', async ({ todoPage: page }) => {
    await expect(page.getByTestId('undo-button')).toBeDisabled()
  })

  test('redo button disabled when nothing to redo', async ({ todoPage: page }) => {
    await expect(page.getByTestId('redo-button')).toBeDisabled()
  })

  test('Ctrl+Z undoes last action', async ({ todoPage: page }) => {
    await addTodo(page, 'Keyboard undo')
    await expect(page.getByTestId('todo-item')).toHaveCount(1)

    await page.keyboard.press('Control+z')

    await expect(page.getByTestId('todo-item')).toHaveCount(0)
  })

  test('Ctrl+Y redoes', async ({ todoPage: page }) => {
    await addTodo(page, 'Keyboard redo')
    await page.keyboard.press('Control+z')
    await expect(page.getByTestId('todo-item')).toHaveCount(0)

    await page.keyboard.press('Control+y')

    await expect(page.getByTestId('todo-item')).toHaveCount(1)
    await expect(page.getByTestId('todo-text')).toHaveText('Keyboard redo')
  })
})
