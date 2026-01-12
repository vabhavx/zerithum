import time
from playwright.sync_api import sync_playwright, expect

def verify_transactions_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        print("Navigating to Transactions page...")
        # Since the app requires authentication or mock data, we might hit an issue if we just go to /transactions.
        # However, checking the code, base44 client seems to be mocked or we are in a dev environment.
        # But wait, base44 client uses `Deno.env`? No, that's backend.
        # Frontend uses `@/api/base44Client`.
        # If the backend is not running, requests will fail.
        # But the Transactions page uses `useQuery` which will handle loading/error states.
        # We should at least see the skeleton or error/empty state.

        # NOTE: The memory says "Frontend verification is performed using temporary Playwright (Python or Node) scripts located in `verification/` that interact with the local Vite development server."
        # And "The `pnpm build` command requires the `VITE_BASE44_APP_BASE_URL` environment variable to be set... to correctly initialize the Vite proxy configuration."

        # If we don't have a backend running, `useQuery` will likely just stay in loading or error.
        # `Transactions.jsx` has a Skeleton loader.

        page.goto("http://localhost:5173/transactions")

        # Wait for either table or skeleton
        try:
            # Check for header
            expect(page.get_by_role("heading", name="Transactions")).to_be_visible(timeout=10000)
            print("Header found.")

            # Take screenshot of initial state
            page.screenshot(path="verification/transactions_initial.png")
            print("Initial screenshot taken.")

            # Since we don't have a backend, we might just see skeletons or "No transactions found".
            # If we see "No transactions found", that means the empty list was rendered, so our component structure is working (at least the table structure).
            # If we see skeletons, it means it's loading.

            # Let's wait a bit to see if it settles.
            time.sleep(2)

            page.screenshot(path="verification/transactions_loaded.png")
            print("Loaded screenshot taken.")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")

        finally:
            browser.close()

if __name__ == "__main__":
    verify_transactions_page()
