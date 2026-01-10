from playwright.sync_api import sync_playwright

def verify_transactions(page):
    # Go to transactions page
    page.goto("http://localhost:5173/transactions")

    # Wait for page content to load (or at least the skeleton/header)
    page.wait_for_selector("h1", timeout=10000)

    # Take screenshot of the transactions page
    # Even if data fails to load, we should see the table structure and date columns
    page.screenshot(path="verification/transactions.png")

    # Check if we can find any date text (might be tricky without data)
    # But we can check if the table headers are present

    # Check Connected Apps page as well
    page.goto("http://localhost:5173/settings/connected-apps")
    page.wait_for_selector("h1", timeout=10000)
    page.screenshot(path="verification/connected_apps.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_transactions(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
