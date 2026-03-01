import { test, expect, addTodo, cleanDb } from './fixtures/collab'

test.beforeAll(() => {
  cleanDb()
})

test.describe('Todo Collaboration', () => {
  test('User A adds a todo, User B sees it', async ({ twoUsers: { pageA, pageB } }) => {
    await addTodo(pageA, 'Shared task')

    await expect(pageB.getByTestId('todo-text').filter({ hasText: 'Shared task' })).toBeVisible()
  })

  test('User B toggles done, User A sees strikethrough', async ({ twoUsers: { pageA, pageB } }) => {
    await addTodo(pageA, 'Toggle me')

    await pageB.getByTestId('todo-text').filter({ hasText: 'Toggle me' }).waitFor()
    await pageB.getByTestId('todo-checkbox').click()

    await expect(pageA.getByTestId('todo-item')).toHaveClass(/done/)
  })

  test('User A edits text, User B sees updated text', async ({ twoUsers: { pageA, pageB } }) => {
    await addTodo(pageA, 'Before edit')

    await pageB.getByTestId('todo-text').filter({ hasText: 'Before edit' }).waitFor()

    await pageA.getByTestId('todo-text').filter({ hasText: 'Before edit' }).dblclick()
    await pageA.getByTestId('todo-edit-input').fill('After edit')
    await pageA.getByTestId('todo-edit-input').press('Enter')

    await expect(pageB.getByTestId('todo-text').filter({ hasText: 'After edit' })).toBeVisible()
  })

  test('User A deletes, User B sees it removed', async ({ twoUsers: { pageA, pageB } }) => {
    await addTodo(pageA, 'Remove me')

    await pageB.getByTestId('todo-text').filter({ hasText: 'Remove me' }).waitFor()

    await pageA.getByTestId('todo-item').hover()
    await pageA.getByTestId('delete-button').click()

    await expect(pageB.getByTestId('todo-item')).toHaveCount(0)
  })

  test('both users see same todo count', async ({ twoUsers: { pageA, pageB } }) => {
    await addTodo(pageA, 'Item 1')
    await addTodo(pageA, 'Item 2')
    await addTodo(pageA, 'Item 3')

    await expect(pageA.getByTestId('todo-item')).toHaveCount(3)
    await expect(pageB.getByTestId('todo-item')).toHaveCount(3)
  })
})
