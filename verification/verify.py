from playwright.sync_api import sync_playwright, expect
import time
import json

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Mock Auth
    page.route("**/entities/User/me*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"id": "user_1", "email": "test@example.com", "full_name": "Test User"}'
    ))

    # Mock Public Settings
    page.route("**/public-settings/by-id/*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"theme": "dark", "name": "Zerithum"}'
    ))

    # Mock Revenue Transactions - Return Array
    page.route("**/entities/RevenueTransaction*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([{"id": "rev_1", "amount": 100, "description": "YouTube Ad Revenue", "transaction_date": "2024-01-01T10:00:00Z", "platform": "YouTube"}, {"id": "rev_2", "amount": 50, "description": "Patreon", "transaction_date": "2024-01-02T10:00:00Z", "platform": "Patreon"}])
    ))

    # Mock Bank Transactions - Return Array
    page.route("**/entities/BankTransaction*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([{"id": "bank_1", "amount": 100, "description": "Deposit Google", "transaction_date": "2024-01-03T10:00:00Z"}])
    ))

    # Mock Reconciliations - Return Array
    page.route("**/entities/Reconciliation*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([{"id": "rec_1", "revenue_transaction_id": "rev_1", "bank_transaction_id": "bank_1", "match_category": "exact_match", "reconciled_by": "auto", "match_confidence": 1.0}])
    ))

    # Mock Connected Platforms (for SyncHistory) - Return Array
    page.route("**/entities/ConnectedPlatform*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([{"id": "conn_1", "platform": "youtube", "user_id": "user_1", "sync_status": "active", "connected_at": "2024-01-01T00:00:00Z", "last_synced_at": "2024-03-01T12:00:00Z"}])
    ))

    # Mock Sync History - Return Array
    page.route("**/entities/SyncHistory*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([{"id": "sync_1", "platform": "youtube", "sync_started_at": "2024-03-01T12:00:00Z", "transactions_synced": 42, "status": "success", "duration_ms": 1500}])
    ))

    # Go to Reconciliation Page
    print("Navigating to Reconciliation...")
    page.goto("http://localhost:3000/Reconciliation")

    # Wait for content
    try:
        expect(page.get_by_text("YouTube Ad Revenue")).to_be_visible(timeout=5000)
    except Exception:
        pass

    # Take screenshot
    page.screenshot(path="verification/reconciliation.png")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
