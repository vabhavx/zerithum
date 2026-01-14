from playwright.sync_api import sync_playwright, expect

def verify_table_headers():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to Transactions page
        # Note: The URL is case sensitive based on pages.config.js keys if using standard Router, but usually browsers handle it.
        # But React Router v6 matches path exactly. Key is "Transactions".
        page.goto("http://localhost:3000/Transactions")

        # Wait for the table header to appear
        # We look for the "Date" button inside a th
        date_button = page.get_by_role("button", name="Date")

        try:
            expect(date_button).to_be_visible(timeout=10000)
            print("Date sort button found!")
        except Exception as e:
            print("Date sort button NOT found. taking screenshot anyway.")
            page.screenshot(path="verification/verification_failed_nav.png")
            raise e

        # Check for aria-sort attribute on the parent th
        # We can find the button's parent
        date_th = date_button.locator("..")

        # Initially it might be sorted by date desc (default in component state)
        # const [sortField, setSortField] = useState('transaction_date');
        # const [sortDirection, setSortDirection] = useState('desc');

        # So aria-sort should be "descending"
        expect(date_th).to_have_attribute("aria-sort", "descending")
        print("Date th has correct initial aria-sort='descending'")

        # Click the button to sort ascending
        date_button.click()

        # Check if aria-sort changed
        expect(date_th).to_have_attribute("aria-sort", "ascending")
        print("Date th updated to aria-sort='ascending' after click")

        # Take screenshot
        page.screenshot(path="verification/verification.png")
        print("Screenshot saved to verification/verification.png")

        browser.close()

if __name__ == "__main__":
    verify_table_headers()
