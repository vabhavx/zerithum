from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Set viewport size to ensure dashboard is visible
        page.set_viewport_size({"width": 1280, "height": 1024})

        try:
            print("Navigating to localhost:5173...")
            page.goto("http://localhost:5173", timeout=60000)

            # Wait for network idle to ensure everything loaded
            try:
                page.wait_for_load_state('networkidle', timeout=5000)
            except:
                print("Network idle timeout, continuing anyway...")

            print("Waiting for dashboard header...")
            # Use a more generic selector to be safe
            page.wait_for_selector("text=ZERITHUM_OPS", timeout=20000)
            print("Dashboard loaded.")

            # Scroll to the dashboard
            dashboard = page.locator("text=ZERITHUM_OPS")
            dashboard.scroll_into_view_if_needed()

            # Wait a bit for any initial render/layout stability
            page.wait_for_timeout(2000)

            # The animation loops. We need to synchronize with it.
            # We can't easily control the react state from outside without exposing it.
            # So we'll just take screenshots at intervals or wait for specific text to appear.

            # 1. Ingesting
            print("Looking for Ingesting stage...")
            # Ingesting is the default start, but we might have joined late.
            # Let's wait for the "Ingesting batch" text to become fully opaque (opacity 1)
            # OR just take a shot now as it cycles quickly.
            # Actually, let's just wait for the loop to restart if we missed it.
            # The loop is: Ingest(3s) -> Scan(2s) -> Anomaly(3.5s) -> Report(2.5s) = 11s total.

            # Let's try to capture the "Ingesting" state by waiting for the text "Ingesting batch" to be visible
            # Note: The text is always there but opacity changes.
            # Playwright's is_visible() checks for opacity > 0? No, checking styles is hard.
            # But the 'particle' elements are conditional!
            # The red particle: absolute right-0 top-1/2 w-2 h-2 bg-red-500 rounded-full blur-[2px]
            # This is only rendered when stage === 'ingesting'.

            # Wait for red particle in the first source box
            print("Waiting for Ingesting particle...")
            page.wait_for_selector(".bg-red-500.rounded-full.blur-\\[2px\\]", timeout=15000)
            page.wait_for_timeout(500) # Wait a bit for it to move
            page.screenshot(path="verification/1_ingestion.png")
            print("Captured Ingestion.")

            # 2. Scanning
            print("Waiting for Scanning stage...")
            # Wait for the blue scanning beam: .bg-blue-500\/50.blur-sm
            page.wait_for_selector(".bg-blue-500\\/50.blur-sm", timeout=15000)
            page.wait_for_timeout(500)
            page.screenshot(path="verification/2_scanning.png")
            print("Captured Scanning.")

            # 3. Anomaly
            print("Waiting for Anomaly stage...")
            # Wait for DISCREPANCY DETECTED text
            page.wait_for_selector("text=DISCREPANCY DETECTED", timeout=15000)
            page.wait_for_timeout(500)
            page.screenshot(path="verification/3_anomaly.png")
            print("Captured Anomaly.")

            # 4. Reporting
            print("Waiting for Reporting stage...")
            # Wait for Reconciled text
            page.wait_for_selector("text=Reconciled", timeout=15000)
            page.wait_for_timeout(500)
            page.screenshot(path="verification/4_reporting.png")
            print("Captured Reporting.")

            print("All stages captured successfully.")

        except Exception as e:
            print(f"Error during verification: {e}")
            page.screenshot(path="verification/error_animation_retry.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
