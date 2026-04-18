import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        await page.goto('http://localhost:3000/reimbursement/medical/current?tab=ANNEXURES', timeout=60000)

        await page.wait_for_timeout(3000)
        await page.screenshot(path='/home/jules/verification/mr_workspace_annexures.png', full_page=True)
        print("Annexures screenshot saved.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
