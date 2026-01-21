from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Go to localhost:5173 (Vite default port)
        try:
            page.goto("http://localhost:5173", timeout=10000)

            # Wait for main content to load
            # Check for "Transaction Analysis" or something visible
            # Since auth might be mocked or skipped in local, we need to handle that.
            # But the SDK usually requires some mocking.

            # Let's take a screenshot of whatever loads
            page.wait_for_timeout(2000)
            page.screenshot(path="verification/dashboard.png")
            print("Screenshot taken at verification/dashboard.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
