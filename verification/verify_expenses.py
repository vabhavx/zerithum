from playwright.sync_api import sync_playwright, Page, expect

def test_expenses(page: Page):
    # Mock the expenses API call
    page.route("**/entities/Expense*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='''[
            {
                "id": "1",
                "merchant": "Test Merchant 1",
                "description": "Software Subscription",
                "amount": 99.99,
                "expense_date": "2023-10-25",
                "category": "software_subscriptions",
                "is_tax_deductible": true,
                "deduction_percentage": 100
            },
             {
                "id": "2",
                "merchant": "Office Supply Co",
                "description": "New Chair",
                "amount": 250.00,
                "expense_date": "2023-10-24",
                "category": "office_supplies",
                "is_tax_deductible": true,
                "deduction_percentage": 100
            }
        ]'''
    ))

    # Go to expenses page
    page.goto("http://localhost:5173/expenses")

    # Wait for the rows to render
    expect(page.get_by_text("Test Merchant 1")).to_be_visible()
    expect(page.get_by_text("Office Supply Co")).to_be_visible()

    # Wait a bit for animations
    page.wait_for_timeout(1000)

    # Take screenshot
    page.screenshot(path="verification/verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_expenses(page)
        finally:
            browser.close()
