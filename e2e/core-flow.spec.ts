import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '今天吃什么' })).toBeVisible()
})

test('scenarios A-E: diners, guest, pantry, preset, generation, replace and confirmation', async ({ page }, testInfo) => {
  await page.getByRole('link', { name: '做菜人' }).click()
  await page.getByRole('button', { name: '登记外婆会做的菜' }).click()
  for (const dish of ['番茄炒蛋', '红烧肉', '清蒸鱼', '清炒青菜', '番茄蛋汤', '冬瓜排骨汤']) {
    await page.getByRole('button', { name: `把${dish}设为外婆会做` }).click()
  }
  await expect(page.getByText('已登记 6 道菜')).toBeVisible()
  await mkdir('output/playwright', { recursive: true })
  await page.screenshot({ path: `output/playwright/cooks-${testInfo.project.name}.png`, fullPage: true })
  await page.getByRole('button', { name: '返回做菜人' }).click()
  await page.getByRole('link', { name: '今天吃什么' }).click()

  await page.getByRole('button', { name: '选择爷爷' }).click()
  await page.getByRole('button', { name: '选择奶奶' }).click()
  await expect(page.getByText('已选择 2 位家庭成员')).toBeVisible()
  await expect(page.getByLabel('总人数', { exact: true })).toContainText('2')

  await page.getByRole('button', { name: '增加总人数' }).click()
  await expect(page.getByText('另有 1 位客人')).toBeVisible()

  await page.getByRole('button', { name: '改一下' }).click()
  const potato = page.getByRole('button', { name: /土豆/ })
  await expect(potato).toHaveAttribute('aria-pressed', 'false')
  await potato.click()
  await expect(potato).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: '选好了，返回' }).click()
  await expect(page.getByText(/11 种/)).toBeVisible()

  await page.getByRole('button', { name: '简单吃，2热菜0凉菜1汤' }).click()
  await expect(page.getByLabel('热菜数量', { exact: true })).toContainText('2')
  await expect(page.getByLabel('凉菜数量', { exact: true })).toContainText('0')
  await page.getByRole('button', { name: '增加热菜' }).click()
  await expect(page.getByLabel('热菜数量', { exact: true })).toContainText('3')
  await page.getByRole('button', { name: '减少热菜' }).click()

  await page.getByRole('button', { name: '选择外婆做菜' }).click()
  await expect(page.getByRole('button', { name: '选择外婆做菜' })).toHaveAttribute('aria-pressed', 'true')

  await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.evaluate(() => window.scrollTo(0, 0))
  await mkdir('output/playwright', { recursive: true })
  await page.screenshot({ path: `output/playwright/home-${testInfo.project.name}.png` })

  await page.getByRole('button', { name: '随机这一桌' }).click()
  await expect(page.getByRole('heading', { name: '今天这桌定好了' })).toBeVisible()
  await expect(page.getByLabel('外婆下厨')).toBeVisible()
  const namesBefore = await page.locator('.dish-result-row h2').allTextContents()
  expect(namesBefore).toHaveLength(3)
  expect(namesBefore.every((name) => ['番茄炒蛋', '红烧肉', '清蒸鱼', '清炒青菜', '番茄蛋汤', '冬瓜排骨汤'].includes(name))).toBe(true)

  await page.locator('.dish-result-row').first().getByRole('button', { name: /^换掉/ }).click()
  const namesAfter = await page.locator('.dish-result-row h2').allTextContents()
  expect(namesAfter[0]).not.toBe(namesBefore[0])
  expect(['番茄炒蛋', '红烧肉', '清蒸鱼', '清炒青菜', '番茄蛋汤', '冬瓜排骨汤']).toContain(namesAfter[0])
  expect(namesAfter.slice(1)).toEqual(namesBefore.slice(1))
  await expect(page.getByText('只更换了这一道，其他菜保持不变。')).toBeVisible()

  await page.getByRole('button', { name: '就吃这些' }).click()
  await expect(page.getByText(/今天晚餐已记录/)).toBeVisible()

  await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: `output/playwright/result-${testInfo.project.name}.png` })
})

test('management data remains after reload', async ({ page }, testInfo) => {
  await page.getByRole('link', { name: '菜品' }).click()
  await page.getByRole('button', { name: '新增菜品' }).click()
  await page.getByLabel('菜名', { exact: true }).fill('葱爆肉片')
  await page.getByRole('button', { name: '选择猪肉' }).click()
  await page.getByRole('button', { name: '保存菜品' }).click()
  await expect(page.getByText('葱爆肉片', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('葱爆肉片', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: '食材' }).click()
  await expect(page.getByRole('heading', { name: '食材' })).toBeVisible()

  await page.getByRole('link', { name: '家庭' }).click()
  await page.getByRole('button', { name: '新增家庭成员' }).click()
  await page.getByLabel('成员称呼').fill('外婆')
  await page.getByRole('button', { name: '保存成员' }).click()
  await expect(page.getByRole('heading', { name: '外婆' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: '外婆' })).toBeVisible()

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: '删除外婆' }).click()
  await expect(page.getByText('✓ 外婆已删除，历史用餐记录仍然保留。')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: '外婆' })).toHaveCount(0)

  await page.getByRole('link', { name: '口味' }).click()
  await expect(page.getByRole('heading', { name: '家人的口味' })).toBeVisible()
  await expect(page.getByRole('button', { name: '设置外婆的偏好' })).toHaveCount(0)

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await page.getByRole('link', { name: '菜单预设' }).click()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  const simplePreset = page.locator('article').filter({ hasText: '简单吃' })
  await simplePreset.getByRole('button', { name: '编辑' }).click()
  await page.getByLabel('预设名称').fill('极简晚饭')
  await page.getByRole('button', { name: '保存修改' }).click()
  await expect(page.getByRole('heading', { name: '极简晚饭' })).toBeVisible()
  await page.reload()
  await page.getByRole('link', { name: '菜单预设' }).click()
  await expect(page.getByRole('heading', { name: '极简晚饭' })).toBeVisible()

  await mkdir('output/playwright', { recursive: true })
  await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: `output/playwright/management-${testInfo.project.name}.png` })
})
