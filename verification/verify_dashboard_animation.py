from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Page Error: {err}"))

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

            # Capture initial state (Ingestion Stream)
            page.screenshot(path="verification/1_ingestion_stream.png")
            print("Captured Ingestion Stream.")

            # Wait for "ANALYZING PAYLOAD..."
            print("Waiting for Analyzing stage...")
            try:
                page.wait_for_selector("text=ANALYZING PAYLOAD...", timeout=20000)
                page.screenshot(path="verification/2_analyzing.png")
                print("Captured Analyzing.")
            except:
                print("Could not catch 'ANALYZING PAYLOAD...' in time.")

            # Wait for "COMPARING LEDGERS..."
            print("Waiting for Comparing stage...")
            try:
                page.wait_for_selector("text=COMPARING LEDGERS...", timeout=20000)
                page.screenshot(path="verification/3_comparing.png")
                print("Captured Comparing.")
            except:
                print("Could not catch 'COMPARING LEDGERS...' in time.")

            # Wait for result ("DISCREPANCY DETECTED" or "RECONCILIATION COMPLETE")
            print("Waiting for Result stage...")
            try:
                # Wait for either result
                page.wait_for_function(
                    "document.body.innerText.includes('DISCREPANCY DETECTED') || document.body.innerText.includes('RECONCILIATION COMPLETE')",
                    timeout=20000
                )
                page.screenshot(path="verification/4_result.png")
                print("Captured Result.")
            except:
                print("Could not catch result in time.")

            print("All stages captured successfully.")

        except Exception as e:
            print(f"Error during verification: {e}")
            page.screenshot(path="verification/error_animation_retry.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
