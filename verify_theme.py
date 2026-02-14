from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            page.goto("http://localhost:5173")

            # Wait for content to load
            page.wait_for_selector('text=Reconcile creator payouts')

            # Verify Nav
            nav = page.wait_for_selector('.card-nav')
            assert nav.is_visible()

            # Check for light theme characteristics (e.g. background color)
            # This is hard to check programmatically perfectly, but we can check if body or main has bg-white class
            # But styled components might not expose it easily on computed styles.
            # Visual check via screenshot is best.

            # Screenshot full page
            os.makedirs("verification", exist_ok=True)
            page.screenshot(path="verification/landing_light_theme.png", full_page=True)
            print("Screenshot saved to verification/landing_light_theme.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
