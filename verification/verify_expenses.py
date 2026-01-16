from playwright.sync_api import sync_playwright

def verify_expenses(page):
    # Mock the API responses since proxy is not enabled and we want to avoid network errors
    page.route("**/entities/Expense", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='[{"id": "1", "amount": 100, "merchant": "Test Merchant", "description": "Test Desc", "category": "software_subscriptions", "is_tax_deductible": true, "deduction_percentage": 100, "expense_date": "2023-10-27"}]'
    ))

    # Also mock auth/me to avoid redirects if there are any
    page.route("**/auth/me", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"id": "user1", "email": "test@example.com"}'
    ))

    # Mock ConnectedPlatform for layout/nav checks if needed
    page.route("**/entities/ConnectedPlatform", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='[]'
    ))

    page.goto("http://localhost:5173/expenses")

    # Wait for page to load
    page.wait_for_timeout(3000)

    # Click "Add Expense" button
    page.get_by_role("button", name="Add Expense").click()

    # Wait for dialog
    page.wait_for_selector("text=Add Expense")
    page.wait_for_timeout(1000)

    # Take screenshot
    page.screenshot(path="verification/expenses_dialog.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_expenses(page)
        finally:
            browser.close()
