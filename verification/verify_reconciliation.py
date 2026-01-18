import time
from playwright.sync_api import sync_playwright

def test_reconciliation_render():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Mocking the SDK/API calls would be ideal, but for now we just want to see if the page renders without crashing
        # and if the memoization doesn't break basic functionality.
        # Since we don't have a real backend, we rely on the app handling empty states or loading states.

        # However, since I need to verify that I didn't BREAK anything, I should check if the page loads.
        # The memory says: "Frontend verification scripts (Playwright) using `@base44/sdk` must mock API endpoints"
        # I need to mock the API calls because the app uses @base44/sdk which might try to hit a real endpoint.

        page = browser.new_page()

        # Route API calls to return mock data
        page.route("**/entities/RevenueTransaction", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"data": [{"id": "t1", "amount": 100, "transaction_date": "2023-01-01", "platform": "youtube", "description": "Test Transaction"}]}'
        ))

        page.route("**/entities/Reconciliation", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"data": []}'
        ))

        page.route("**/entities/BankTransaction", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"data": []}'
        ))

        page.goto("http://localhost:5173/reconciliation")

        # Wait for the page to load
        try:
            page.wait_for_selector("text=Reconciliation", timeout=5000)
            page.wait_for_selector("text=Match platform revenue with bank deposits", timeout=5000)

            # Allow some time for the memoized calculation to run
            time.sleep(1)

            page.screenshot(path="verification/reconciliation.png")
            print("Screenshot taken")
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")

        browser.close()

if __name__ == "__main__":
    test_reconciliation_render()
