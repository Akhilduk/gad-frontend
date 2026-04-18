import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Navigate to dashboard list
        await page.goto('http://localhost:3000/reimbursement/medical', timeout=60000)

        # Wait
        await page.wait_for_timeout(3000)

        # Take a screenshot
        await page.screenshot(path='/home/jules/verification/mr_list_new.png', full_page=True)
        print("List screenshot saved.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
