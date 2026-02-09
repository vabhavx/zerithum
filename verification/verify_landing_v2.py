from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Increase viewport size to capture more content
        page = browser.new_page(viewport={'width': 1280, 'height': 800})

        # Navigate to Landing Page
        page.goto("http://localhost:5173/")
        page.wait_for_load_state("networkidle")

        # Wait for initial animations
        page.wait_for_timeout(2000)

        # Screenshot Hero
        page.screenshot(path="verification/landing_hero_v2.png")
        print("Captured landing_hero_v2.png")

        # Scroll to Reconciliation Section
        page.evaluate("window.scrollTo(0, window.innerHeight)")
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/landing_scroll_1_v2.png")
        print("Captured landing_scroll_1_v2.png")

        # Scroll to Analytics Section
        page.evaluate("window.scrollTo(0, window.innerHeight * 1.5)")
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/landing_scroll_2_v2.png")
        print("Captured landing_scroll_2_v2.png")

        # Scroll to Bottom (CTA)
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/landing_cta_v2.png")
        print("Captured landing_cta_v2.png")

        browser.close()

if __name__ == "__main__":
    run()
