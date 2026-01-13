from playwright.sync_api import sync_playwright, expect

def verify_connected_platforms():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Enable console logging
        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        page.on("request", lambda request: print(f"Request: {request.method} {request.url}"))

        # 1. Mock Public Settings (AuthContext check)
        # Matches: http://localhost:5173/api/apps/public/prod/public-settings/by-id/null
        page.route("**/public-settings/by-id/*", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"id": "app123", "name": "Zerithum", "settings": {}}'
        ))

        # 2. Mock User Auth
        # Matches: http://localhost:5173/api/apps/null/entities/User/me
        page.route("**/entities/User/me", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"id": "user123", "email": "test@example.com", "plan_tier": "pro"}'
        ))

        # 3. Mock ConnectedPlatform
        # Matches: http://localhost:5173/api/apps/null/entities/ConnectedPlatform/filter (implied from code)
        def handle_platforms(route):
            print(f"Intercepted ConnectedPlatform request: {route.request.url}")
            route.fulfill(
                status=200,
                content_type="application/json",
                body='[{"id": "conn1", "platform": "youtube", "sync_status": "active", "connected_at": "2023-01-01T00:00:00Z", "last_synced_at": "2023-01-02T00:00:00Z", "user_id": "user123"}]'
            )

        page.route("**/entities/ConnectedPlatform**", handle_platforms)

        # 4. Mock SyncHistory
        page.route("**/entities/SyncHistory*", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='[]'
        ))

        print("Navigating to ConnectedPlatforms...")
        page.goto("http://localhost:5173/ConnectedPlatforms")

        # Wait specifically for the Youtube text which means data loaded
        try:
            # Wait longer and for the specific platform card
            expect(page.get_by_text("YouTube")).to_be_visible(timeout=10000)
            print("Platform card loaded.")
        except:
            print("Could not find 'YouTube' text. Dumping page content...")
            page.screenshot(path="verification/failed_loading_3.png")
            print("Screenshot saved to verification/failed_loading_3.png")
            browser.close()
            return

        # 1. Verify Aria Label on Disconnect Button
        # The button is the trash icon one.
        print("Verifying aria-label...")
        disconnect_button = page.get_by_label("Disconnect YouTube")
        if disconnect_button.is_visible():
            print("Verified: Button with aria-label 'Disconnect YouTube' is visible.")
        else:
            print("Failed: Button with aria-label 'Disconnect YouTube' not found.")
            page.screenshot(path="verification/failed_aria.png")
            browser.close()
            return

        # 2. Click Disconnect
        print("Clicking disconnect...")
        disconnect_button.click()

        # 3. Verify Alert Dialog
        print("Verifying Alert Dialog...")
        try:
            # shadcn/ui alert dialog usually has role "alertdialog"
            # It might be an alertdialog or just a dialog. Radix UI usually uses 'alertdialog' role.
            # But let's check for text first as it is more reliable than role sometimes if role is missing.

            expect(page.get_by_text("Disconnect YouTube?")).to_be_visible(timeout=5000)
            print("Verified: Alert Dialog appeared with correct text.")

            # 4. Screenshot
            page.screenshot(path="verification/disconnect_dialog.png")
            print("Screenshot saved to verification/disconnect_dialog.png")

        except Exception as e:
            print(f"Failed to verify dialog: {e}")
            page.screenshot(path="verification/failed_dialog.png")

        browser.close()

if __name__ == "__main__":
    verify_connected_platforms()
