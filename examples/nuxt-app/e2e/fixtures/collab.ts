import { test as base, type Page } from '@playwright/test'
import { existsSync, unlinkSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const DATA_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../data')

export function cleanDb() {
  for (const name of ['collab.db', 'collab.db-wal', 'collab.db-shm']) {
    const filePath = resolve(DATA_DIR, name)
    if (existsSync(filePath)) {
      unlinkSync(filePath)
    }
  }
}

async function waitForSync(page: Page) {
  await page
    .getByTestId('connection-status')
    .filter({ hasText: 'Synced' })
    .waitFor({ timeout: 15_000 })
}

async function clearAllTodos(page: Page) {
  let hadTodos = false
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const count = await page.getByTestId('todo-item').count()
    if (count === 0) break
    hadTodos = true
    await page.getByTestId('todo-item').first().hover()
    await page.getByTestId('delete-button').first().click()
  }
  if (hadTodos) {
    // Reload to reset client-side undo manager after clearing leftover todos
    await page.reload()
    await waitForSync(page)
  }
}

export async function addTodo(page: Page, text: string) {
  await page.getByTestId('todo-input').fill(text)
  await page.getByTestId('add-button').click()
  await page.getByTestId('todo-text').filter({ hasText: text }).waitFor()
}

type Fixtures = {
  todoPage: Page
  twoUsers: { pageA: Page; pageB: Page }
}

export const test = base.extend<Fixtures>({
  todoPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('/')
    await waitForSync(page)
    await clearAllTodos(page)
    await use(page)
    await context.close()
  },

  twoUsers: async ({ browser }, use) => {
    const contextA = await browser.newContext()
    const pageA = await contextA.newPage()
    await pageA.goto('/')
    await waitForSync(pageA)
    await clearAllTodos(pageA)

    const contextB = await browser.newContext()
    const pageB = await contextB.newPage()
    await pageB.goto('/')
    await waitForSync(pageB)

    await use({ pageA, pageB })
    await contextA.close()
    await contextB.close()
  },
})

export { expect } from '@playwright/test'
