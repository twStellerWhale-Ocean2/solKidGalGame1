import importlib.util
import json
import os
import subprocess
import time


QA_DIR = r"C:\Users\User\Documents\Github\solKidGalGame\.codex\log\20260601-135745-qa"
CAPTURE_SCRIPT = r"C:\Users\User\Documents\Github\solKidGalGame\.codex\log\20260601-135745-cdp_capture.py"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 9336
APP_PORT = int(os.environ.get("APP_PORT", "4174"))
PROFILE_DIR = os.path.join(QA_DIR, "chrome-selftest-profile")


spec = importlib.util.spec_from_file_location("cdp_capture", CAPTURE_SCRIPT)
cdp_capture = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cdp_capture)


def run_selftest(url, selector):
    target = cdp_capture.new_target()
    cdp = cdp_capture.CDP(target["webSocketDebuggerUrl"])
    try:
        cdp.send("Page.enable")
        cdp.send("Runtime.enable")
        cdp.send("Page.navigate", {"url": url})
        cdp.wait_event("Page.loadEventFired", timeout=20)
        cdp.send("Runtime.evaluate", {
            "expression": "new Promise(resolve => setTimeout(resolve, 1000))",
            "awaitPromise": True,
        })
        result = cdp.send("Runtime.evaluate", {
            "expression": f"document.querySelector({json.dumps(selector)})?.textContent || ''",
            "returnByValue": True,
        })["result"]["value"]
        if not result:
            raise RuntimeError(f"{selector} not found")
        return json.loads(result)
    finally:
        cdp.close()
        cdp_capture.close_target(target["id"])


def main():
    os.makedirs(PROFILE_DIR, exist_ok=True)
    cdp_capture.PORT = PORT
    chrome = subprocess.Popen([
        CHROME,
        "--headless=new",
        "--disable-gpu",
        "--disable-background-networking",
        "--no-first-run",
        f"--remote-debugging-port={PORT}",
        f"--user-data-dir={PROFILE_DIR}",
        "about:blank",
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        cdp_capture.wait_for_chrome()
        save = run_selftest(f"http://127.0.0.1:{APP_PORT}/?selftest=save-load&r=20260601-current#home", "#selfTestResult")
        monkey = run_selftest(f"http://127.0.0.1:{APP_PORT}/?selftest=monkey&r=20260601-current#home", "#monkeyTestResult")
    finally:
        chrome.terminate()
        try:
            chrome.wait(timeout=5)
        except subprocess.TimeoutExpired:
            chrome.kill()
    with open(os.path.join(QA_DIR, "selftest-save-load-result.json"), "w", encoding="utf-8") as handle:
        json.dump(save, handle, ensure_ascii=False, indent=2)
    with open(os.path.join(QA_DIR, "selftest-monkey-result.json"), "w", encoding="utf-8") as handle:
        json.dump(monkey, handle, ensure_ascii=False, indent=2)
    print(json.dumps({
        "saveLoadPassed": save.get("passed"),
        "monkeyPassed": monkey.get("passed"),
        "monkeySteps": monkey.get("steps"),
        "monkeyErrors": monkey.get("errors"),
    }, ensure_ascii=False, indent=2))
    time.sleep(0.5)


if __name__ == "__main__":
    main()
