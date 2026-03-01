import { test, expect, addTodo, cleanDb } from './fixtures/collab'

test.beforeAll(() => {
  cleanDb()
})

test.describe('Todo CRUD', () => {
  test('add a new todo', async ({ todoPage: page }) => {
    await addTodo(page, 'Buy groceries')

    await expect(page.getByTestId('todo-text').filter({ hasText: 'Buy groceries' })).toBeVisible()
    await expect(page.getByTestId('todo-input')).toHaveValue('')
  })

  test('toggle todo done', async ({ todoPage: page }) => {
    await addTodo(page, 'Exercise')

    await page.getByTestId('todo-checkbox').click()

    await expect(page.getByTestId('todo-item')).toHaveClass(/done/)
  })

  test('toggle todo undone', async ({ todoPage: page }) => {
    await addTodo(page, 'Read a book')

    await page.getByTestId('todo-checkbox').click()
    await expect(page.getByTestId('todo-item')).toHaveClass(/done/)

    await page.getByTestId('todo-checkbox').click()
    await expect(page.getByTestId('todo-item')).not.toHaveClass(/done/)
  })

  test('edit todo via double-click and Enter', async ({ todoPage: page }) => {
    await addTodo(page, 'Original text')

    await page.getByTestId('todo-text').dblclick()
    const editInput = page.getByTestId('todo-edit-input')
    await expect(editInput).toBeVisible()
    await editInput.fill('Updated text')
    await editInput.press('Enter')

    await expect(page.getByTestId('todo-text').filter({ hasText: 'Updated text' })).toBeVisible()
  })

  test('cancel edit with Escape', async ({ todoPage: page }) => {
    await addTodo(page, 'Keep this text')

    await page.getByTestId('todo-text').dblclick()
    const editInput = page.getByTestId('todo-edit-input')
    await editInput.fill('Changed text')
    await editInput.press('Escape')

    await expect(page.getByTestId('todo-text').filter({ hasText: 'Keep this text' })).toBeVisible()
  })

  test('delete todo', async ({ todoPage: page }) => {
    await addTodo(page, 'Delete me')

    await page.getByTestId('todo-item').hover()
    await page.getByTestId('delete-button').click()

    await expect(page.getByTestId('todo-item')).toHaveCount(0)
  })

  test('cannot add empty todo', async ({ todoPage: page }) => {
    await expect(page.getByTestId('add-button')).toBeDisabled()

    await page.getByTestId('todo-input').fill('   ')
    await expect(page.getByTestId('add-button')).toBeDisabled()
  })

  test('empty state shows when no todos exist', async ({ todoPage: page }) => {
    await expect(page.getByTestId('empty-state')).toBeVisible()
    await expect(page.getByTestId('empty-state')).toHaveText('No todos yet. Add one above!')
  })

  test('empty state hides after adding a todo', async ({ todoPage: page }) => {
    await expect(page.getByTestId('empty-state')).toBeVisible()

    await addTodo(page, 'First todo')

    await expect(page.getByTestId('empty-state')).not.toBeVisible()
  })

  test('empty state reappears after deleting last todo', async ({ todoPage: page }) => {
    await addTodo(page, 'Last one')
    await expect(page.getByTestId('empty-state')).not.toBeVisible()

    await page.getByTestId('todo-item').hover()
    await page.getByTestId('delete-button').click()

    await expect(page.getByTestId('empty-state')).toBeVisible()
  })

  // TODO: Drag-to-reorder test deferred — SortableJS uses JS pointer events internally,
  // making locator.dragTo() unreliable. Requires manual page.mouse simulation with intermediate steps.
  test.skip('drag to reorder', async ({ todoPage: _page }) => {
    // Placeholder for drag-to-reorder test
  })
})
