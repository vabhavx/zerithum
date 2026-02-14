from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            page.goto("http://localhost:5173", timeout=60000)

            # Wait a bit
            page.wait_for_timeout(5000)

            # Screenshot
            os.makedirs("verification", exist_ok=True)
            page.screenshot(path="verification/landing_debug.png", full_page=True)
            print("Screenshot saved to verification/landing_debug.png")

            content = page.content()
            print("Page content length:", len(content))

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
