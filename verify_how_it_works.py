from playwright.sync_api import sync_playwright
import time

def verify_how_it_works():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 800})

        try:
            print("Navigating to http://localhost:5173/ ...")
            page.goto("http://localhost:5173/", timeout=60000)

            # Wait for content to load
            print("Waiting for networkidle...")
            page.wait_for_load_state("networkidle")

            # Locate the How It Works section
            print("Locating 'How It Works' section...")
            section_header = page.get_by_text("Revenue, reality checked.")
            section_header.scroll_into_view_if_needed()

            # Capture Orbit State
            print("Waiting for Orbit state...")
            time.sleep(1)
            page.screenshot(path="verification_orbit.png", full_page=False)

            # Capture Snap State (it happens fast, might miss it but try)
            print("Waiting for Snap...")
            time.sleep(2) # 1s Orbit -> 2s Snap trigger

            # Capture Unified State
            print("Waiting for Unified state...")
            time.sleep(1)
            page.screenshot(path="verification_unified.png", full_page=False)

            print("Verification complete.")

        except Exception as e:
            print(f"Error during verification: {e}")
            page.screenshot(path="verification_error.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_how_it_works()
