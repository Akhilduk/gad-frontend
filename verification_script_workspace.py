import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # We know we mocked authentication in previous steps and the page loads /reimbursement/medical/current directly
        print("Navigating to Medical Reimbursement Case Workspace...")
        await page.goto('http://localhost:3000/reimbursement/medical/current', timeout=60000)

        # Wait for the client-side rendering
        await page.wait_for_selector('.modernContainer', timeout=30000)

        # Take a screenshot of the default SUMMARY tab
        await page.screenshot(path='/home/jules/verification/mr_workspace_summary.png', full_page=True)
        print("Summary tab screenshot saved.")

        # Click TREATMENT NOTE tab
        await page.click("text='TREATMENT NOTE'")
        await page.wait_for_timeout(1000) # give it a moment to render
        await page.screenshot(path='/home/jules/verification/mr_workspace_treatment.png', full_page=True)
        print("Treatment Note tab screenshot saved.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
