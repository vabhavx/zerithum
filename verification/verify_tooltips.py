from playwright.sync_api import sync_playwright, Page, expect

def test_tooltips(page: Page):
    # Mock data
    mock_user = {
        "id": "user_123",
        "email": "test@example.com",
        "full_name": "Test User"
    }

    mock_platforms = [
        {
            "id": "conn_1",
            "platform": "youtube",
            "user_id": "user_123",
            "sync_status": "active",
            "connected_at": "2023-01-01T12:00:00Z",
            "last_synced_at": "2023-01-02T12:00:00Z"
        },
        {
            "id": "conn_2",
            "platform": "stripe",
            "user_id": "user_123",
            "sync_status": "error",
            "connected_at": "2023-01-03T12:00:00Z",
            "error_message": "Invalid API Key"
        }
    ]

    # Mock fetch requests
    def handle_route(route):
        if route.request.resource_type not in ["fetch", "xhr"]:
            try:
                route.continue_()
            except:
                pass
            return

        url = route.request.url
        print(f"Intercepted: {url}")

        # Only intercept likely API calls
        if "User/me" in url or "auth/me" in url:
            print(f"Mocking auth: {url}")
            route.fulfill(status=200, json=mock_user)
        elif "public-settings" in url:
            print(f"Mocking settings: {url}")
            route.fulfill(status=200, json={"allow_signup": True})
        elif "connectedplatform" in url.lower():
             print(f"Mocking platforms: {url}")
             route.fulfill(status=200, json=mock_platforms)
        elif "synchistory" in url.lower():
             print(f"Mocking history: {url}")
             route.fulfill(status=200, json=[])
        else:
            try:
                route.continue_()
            except:
                pass

    page.route("**/*", handle_route)

    # Listen for console logs
    page.on("console", lambda msg: print(f"Console: {msg.text}"))
    page.on("pageerror", lambda err: print(f"Page Error: {err}"))

    # Navigate
    page.goto("http://localhost:5173/ConnectedPlatforms")

    # Wait for loading
    try:
        expect(page.get_by_role("heading", name="Connected Platforms")).to_be_visible(timeout=10000)
    except:
        print("Page didn't load title")
        page.screenshot(path="verification/debug_error.png")
        raise

    # Wait a bit for queries to settle
    page.wait_for_timeout(2000)

    # If "No platforms connected" appears, our mock failed or wasn't used.
    if page.get_by_text("No platforms connected").is_visible():
        print("Mocks failed, no platforms connected.")
        page.screenshot(path="verification/debug_empty.png")

        # Try to debug by printing request urls if needed, but for now just fail
        return

    # Hover over the "View History" button of the first row (YouTube)
    # The button has aria-label="View sync history for YouTube"

    # Locate the button
    try:
        history_btn = page.get_by_label("View sync history for YouTube")
        history_btn.wait_for(state="visible", timeout=5000)
        history_btn.hover()

        # Wait for tooltip
        tooltip = page.get_by_role("tooltip")
        expect(tooltip).to_contain_text("View sync history", timeout=2000)

        # Screenshot with tooltip
        page.screenshot(path="verification/tooltip_history.png")
        print("Screenshot captured: tooltip_history.png")
    except Exception as e:
        print(f"History tooltip failed: {e}")
        page.screenshot(path="verification/debug_history_fail.png")

    # Move mouse to close tooltip
    page.mouse.move(0, 0)
    page.wait_for_timeout(500)

    # Hover over Disconnect
    try:
        disconnect_btn = page.get_by_label("Disconnect YouTube")
        disconnect_btn.hover()

        tooltip_disc = page.get_by_role("tooltip")
        expect(tooltip_disc).to_contain_text("Disconnect YouTube", timeout=2000)

        page.screenshot(path="verification/tooltip_disconnect.png")
        print("Screenshot captured: tooltip_disconnect.png")
    except Exception as e:
        print(f"Disconnect tooltip failed: {e}")
        page.screenshot(path="verification/debug_disconnect_fail.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_tooltips(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
