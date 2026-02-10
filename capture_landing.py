from playwright.sync_api import sync_playwright

def capture():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1600, "height": 1200})
        page.goto("http://localhost:5173/")
        page.wait_for_timeout(2000)
        page.screenshot(path="verification_landing.png", full_page=True)
        browser.close()

if __name__ == "__main__":
    capture()
