from playwright.sync_api import sync_playwright
import time

def verify_how_it_works():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 800})

        # Listen for console logs and errors
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

        try:
            print("Navigating to http://localhost:5173/ ...")
            page.goto("http://localhost:5173/", timeout=60000)

            # Wait for content to load
            print("Waiting for networkidle...")
            page.wait_for_load_state("networkidle")

            # Take screenshot of whatever is there
            print("Taking debug screenshot...")
            page.screenshot(path="verification_debug.png")

            # Locate the How It Works section
            print("Locating 'How It Works' section...")
            section_header = page.get_by_text("Revenue, reality checked.")
            section_header.scroll_into_view_if_needed()

            # Wait for animation
            print("Waiting for initial animation...")
            time.sleep(3)

            page.screenshot(path="verification_unified.png", full_page=False)

            print("Toggling Bank Layer...")
            bank_toggle = page.get_by_text("View with bank layer")
            bank_toggle.click()

            time.sleep(2)

            page.screenshot(path="verification_bank_layer.png", full_page=False)

            print("Verification complete.")

        except Exception as e:
            print(f"Error during verification: {e}")
            page.screenshot(path="verification_error.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_how_it_works()
