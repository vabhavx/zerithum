import time
from playwright.sync_api import sync_playwright, Route

def verify_platforms():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"Page Error: {exc}"))
        # page.on("request", lambda request: print(f"Request: {request.url}"))

        # Mock API responses
        def handle_auth_me(route: Route):
            # print("Intercepted User/me")
            route.fulfill(json={
                "id": "user123",
                "email": "test@example.com",
                "name": "Test User"
            })

        def handle_public_settings(route: Route):
            # print("Intercepted public settings")
            route.fulfill(json={
                "allow_signup": True,
                "allow_google_login": True,
                "name": "Zerithum",
                "description": "Creator revenue operations",
                "logo_url": "https://placehold.co/100x100"
            })

        def handle_connected_platforms(route: Route):
            print("Intercepted ConnectedPlatform list")
            route.fulfill(json=[
                    {
                        "id": "conn1",
                        "user_id": "user123",
                        "platform": "youtube",
                        "sync_status": "active",
                        "connected_at": "2023-01-01T12:00:00Z",
                        "last_synced_at": "2023-10-27T10:00:00Z"
                    },
                    {
                        "id": "conn2",
                        "user_id": "user123",
                        "platform": "patreon",
                        "sync_status": "error",
                        "error_message": "Invalid token",
                        "connected_at": "2023-01-02T12:00:00Z"
                    }
                ])

        def handle_sync_history(route: Route):
             # print("Intercepted SyncHistory")
             route.fulfill(json=[])

        # Intercept requests
        page.route("**/User/me", handle_auth_me)
        page.route("**/auth/me", handle_auth_me)

        page.route("**/public-settings/**", handle_public_settings)

        # Be more specific to avoid intercepting page navigation
        page.route("**/entities/ConnectedPlatform*", handle_connected_platforms)
        page.route("**/entities/SyncHistory*", handle_sync_history)

        # Navigate
        try:
            print("Navigating to http://localhost:5173/ConnectedPlatforms")
            page.goto("http://localhost:5173/ConnectedPlatforms")

            # Wait for loading to finish (Loader2 should disappear)
            # Or wait for "YouTube" to appear
            print("Waiting for YouTube element...")
            page.wait_for_selector("text=YouTube", timeout=10000)

            # Wait a bit for animations
            time.sleep(1)

            # Take screenshot
            page.screenshot(path="verification/verification.png")
            print("Screenshot taken at verification/verification.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_platforms()
