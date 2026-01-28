import os
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Mock Auth
    page.route("**/entities/User/me*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"id": "user_123", "email": "test@example.com"}'
    ))

    # Mock Public Settings
    page.route("**/public-settings*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"settings": {}}'
    ))

    # Mock Connected Platforms
    page.route("**/entities/ConnectedPlatform*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='''[
            {
                "id": "cp_1",
                "platform": "youtube",
                "sync_status": "active",
                "connected_at": "2023-01-01T00:00:00Z",
                "last_synced_at": "2023-01-02T00:00:00Z",
                "user_id": "user_123"
            }
        ]'''
    ))

    # Mock Sync History
    page.route("**/entities/SyncHistory*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='''[
            {
                "id": "sh_1",
                "platform": "youtube",
                "sync_started_at": "2023-01-02T12:00:00Z",
                "transactions_synced": 42,
                "duration_ms": 1500,
                "status": "success",
                "user_id": "user_123"
            },
            {
                "id": "sh_2",
                "platform": "youtube",
                "sync_started_at": "2023-01-01T10:00:00Z",
                "transactions_synced": 0,
                "duration_ms": 500,
                "status": "error",
                "user_id": "user_123"
            }
        ]'''
    ))

    # Go to page
    page.goto("http://localhost:5173/ConnectedPlatforms")

    # Wait for content
    expect(page.get_by_role("heading", name="Connected Platforms")).to_be_visible()

    # Wait for sync history to appear
    # The Sync History section might take a moment to appear as it checks syncHistory.length > 0
    expect(page.get_by_text("Sync History")).to_be_visible()

    # Check if our new rows are rendered
    # Success row
    expect(page.get_by_text("42 transactions")).to_be_visible()
    expect(page.get_by_text("1.5s")).to_be_visible()

    # Error row
    # Use exact=True for "error" text check if needed, but status label is likely "error"
    expect(page.get_by_text("error", exact=True)).to_be_visible()

    # Take screenshot
    os.makedirs("verification", exist_ok=True)
    page.screenshot(path="verification/connected_platforms.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
