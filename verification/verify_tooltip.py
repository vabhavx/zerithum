import os
import json
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    page.on("request", lambda request: print(f"Request: {request.url}"))

    # Mock Auth
    page.route("**/entities/User/me*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps({"id": "user1", "email": "test@example.com", "full_name": "Test User"})
    ))

    # Mock generic auth check if needed
    page.route("**/auth/me*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps({"id": "user1", "email": "test@example.com", "full_name": "Test User"})
    ))

    # Mock public settings
    page.route("**/public-settings*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps({"id": "app1", "name": "Zerithum"})
    ))

    # Mock Reconciliations
    reconciliations = [
        {
            "id": "rec1",
            "match_category": "exact_match",
            "reconciled_by": "auto",
            "match_confidence": 0.95,
            "revenue_transaction_id": "rev1",
            "bank_transaction_id": "bank1",
            "reconciled_at": "2023-10-27T10:00:00Z"
        }
    ]

    # Mock generic list response
    def handle_list(route):
        # We need to match the structure expected by the app.
        # Assuming it expects an array directly based on `data: reconciliations = []` default.
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps(reconciliations)
        )

    page.route("**/entities/Reconciliation*", handle_list)

    # Mock other entities
    page.route("**/entities/RevenueTransaction*", lambda r: r.fulfill(status=200, body='[]'))
    page.route("**/entities/BankTransaction*", lambda r: r.fulfill(status=200, body='[]'))

    # Navigate to Reconciliation page
    print("Navigating to Reconciliation page...")
    page.goto("http://localhost:5173/Reconciliation")

    # Wait for the page to load
    try:
        page.wait_for_selector("text=Reconciliation", timeout=10000)
        print("Page loaded.")
    except:
        print("Page didn't load title 'Reconciliation'")
        page.screenshot(path="verification/debug_load.png")
        return

    # Wait for reconciliation row
    try:
        page.wait_for_selector("text=95% confidence", timeout=5000)
        print("Confidence score found.")
    except:
        print("Confidence score not found")
        page.screenshot(path="verification/debug_noconfidence.png")
        return

    # Hover over the confidence bar
    target = page.locator("[aria-label^='Match confidence score']")
    if target.count() > 0:
        print("Hovering target...")
        target.first.hover()
        # Wait for tooltip
        try:
            page.wait_for_selector("text=Confidence score based on date proximity", timeout=2000)
            print("Tooltip appeared.")
        except:
            print("Tooltip did not appear.")

        # Take screenshot
        page.screenshot(path="verification/tooltip_verification.png")
        print("Screenshot taken.")
    else:
        print("Target element not found")
        page.screenshot(path="verification/debug_notarget.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
