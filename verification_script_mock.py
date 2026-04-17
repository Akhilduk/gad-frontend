import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # We need to mock the token in session storage or local storage since we're hitting /login
        await page.goto('http://localhost:3000/login')

        # Add mock auth state
        await page.evaluate("""() => {
            sessionStorage.setItem('isAuthenticated', 'true');
            sessionStorage.setItem('userRole', 'OFFICER');
            sessionStorage.setItem('penNumber', '123456');
            sessionStorage.setItem('officerName', 'John Doe');
            document.cookie = "authToken=mock_token_123; path=/";
        }""")

        # Now navigate
        await page.goto('http://localhost:3000/reimbursement/medical/current', timeout=60000)

        # Wait for either the client-side rendering or something indicating failure
        try:
            await page.wait_for_selector('.modernContainer', timeout=15000)
            await page.screenshot(path='/home/jules/verification/mr_workspace_summary.png', full_page=True)
            print("Summary tab screenshot saved.")
        except:
            print("Could not find .modernContainer, taking screenshot of whatever loaded")
            await page.screenshot(path='/home/jules/verification/mr_workspace_error.png', full_page=True)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
