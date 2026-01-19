import time
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Mock API responses to force an alert to appear
    # Mock User/me
    page.route("**/functions/invoke/syncPlatformData", lambda route: route.fulfill(status=200, body='{"success": true}'))

    # We need to inject data into the page or mock requests
    # Dashboard fetches:
    # 1. revenueTransactions
    # 2. insights
    # 3. currentUser
    # 4. autopsyEvents
    # 5. connectedPlatforms

    # Mock user
    page.route("**/entities/User/me", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"id": "user123", "email": "test@example.com", "name": "Test User"}'
    ))

    # Mock connected platforms with one error to trigger sync alert
    page.route("**/entities/ConnectedPlatform*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='[{"id": "p1", "platform": "youtube", "sync_status": "error", "title": "YouTube", "user_id": "user123"}]'
    ))

    # Mock other endpoints to avoid errors
    page.route("**/entities/RevenueTransaction*", lambda route: route.fulfill(status=200, body='[]'))
    page.route("**/entities/Insight*", lambda route: route.fulfill(status=200, body='[]'))
    page.route("**/entities/AutopsyEvent*", lambda route: route.fulfill(status=200, body='[]'))

    # Go to Dashboard
    try:
        page.goto("http://localhost:5173", timeout=30000)
    except Exception as e:
        print(f"Navigation failed: {e}")
        # Try waiting a bit more or check if server is up

    # Wait for the alert banner to appear
    # The alert banner should contain text "Failed to Sync"
    try:
        expect(page.get_by_text("Failed to Sync")).to_be_visible(timeout=10000)
    except Exception as e:
        print("Alert banner not found, maybe loading took too long or mocks failed")
        page.screenshot(path="verification/failed_state.png")
        raise e

    # Find the dismiss button
    # We want to verify it has the correct aria-label
    # Since we mocked one platform "YouTube" failing, the title should be "⏰ 1 Platform Failed to Sync"
    # So the label should be "Dismiss ⏰ 1 Platform Failed to Sync"

    button = page.locator("button[aria-label='Dismiss ⏰ 1 Platform Failed to Sync']")

    # Check if it exists
    if button.count() > 0:
        print("SUCCESS: Found button with correct aria-label")
    else:
        print("FAILURE: Did not find button with correct aria-label")
        # Print all buttons aria-labels
        for btn in page.get_by_role("button").all():
            print(f"Button aria-label: {btn.get_attribute('aria-label')}")

    # Take screenshot
    page.screenshot(path="verification/dashboard_alert.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
