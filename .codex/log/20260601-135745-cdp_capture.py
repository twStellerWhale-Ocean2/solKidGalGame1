import base64
import json
import os
import random
import socket
import struct
import subprocess
import time
import urllib.parse
import urllib.request


CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
QA_DIR = r"C:\Users\User\Documents\Github\solKidGalGame\.codex\log\20260601-135745-qa"
PROFILE_DIR = os.path.join(QA_DIR, "chrome-cdp-profile")
PORT = int(os.environ.get("CDP_PORT", "9334"))
APP_PORT = int(os.environ.get("APP_PORT", "4174"))
CAPTURE_LABEL = os.environ.get("CAPTURE_LABEL", "after")
FRESH_PARAM = "&fresh=1" if os.environ.get("FRESH", "1") == "1" else ""
BASE = f"http://127.0.0.1:{APP_PORT}/?selftest=visual-qa{FRESH_PARAM}"


def shot_name(base_name):
    return f"{base_name}-{CAPTURE_LABEL}.png"


SURFACES = [
    ("castle-map", shot_name("mobile-castle-map"), f"{BASE}&surface=castle-map&r=20260601-cdp-{CAPTURE_LABEL}#home"),
    ("kingdom-map", shot_name("mobile-kingdom-map"), f"{BASE}&surface=kingdom-map&r=20260601-cdp-{CAPTURE_LABEL}#map"),
    ("market-scene", shot_name("mobile-market-scene"), f"{BASE}&surface=shop-scene&place=market&r=20260601-cdp-{CAPTURE_LABEL}#map"),
    ("market-detail", shot_name("mobile-market-detail"), f"{BASE}&surface=shop-detail&place=market&coins=500&r=20260601-cdp-{CAPTURE_LABEL}#map"),
    ("market-feedback", shot_name("mobile-market-feedback"), f"{BASE}&surface=shop-feedback&place=market&coins=500&r=20260601-cdp-{CAPTURE_LABEL}#map"),
    ("boutique-scene", shot_name("mobile-boutique-scene"), f"{BASE}&surface=shop-scene&place=boutique&r=20260601-cdp-{CAPTURE_LABEL}#map"),
    ("boutique-detail", shot_name("mobile-boutique-detail"), f"{BASE}&surface=shop-detail&place=boutique&coins=500&r=20260601-cdp-{CAPTURE_LABEL}#map"),
    ("boutique-feedback", shot_name("mobile-boutique-feedback"), f"{BASE}&surface=shop-feedback&place=boutique&coins=500&r=20260601-cdp-{CAPTURE_LABEL}#map"),
    ("shoes-scene", shot_name("mobile-shoes-scene"), f"{BASE}&surface=shop-scene&place=shoeShop&r=20260601-cdp-{CAPTURE_LABEL}#map"),
    ("shoes-detail", shot_name("mobile-shoes-detail"), f"{BASE}&surface=shop-detail&place=shoeShop&coins=500&r=20260601-cdp-{CAPTURE_LABEL}#map"),
    ("shoes-feedback", shot_name("mobile-shoes-feedback"), f"{BASE}&surface=shop-feedback&place=shoeShop&coins=500&r=20260601-cdp-{CAPTURE_LABEL}#map"),
    ("accessory-scene", shot_name("mobile-accessory-scene"), f"{BASE}&surface=shop-scene&place=accessoryShop&r=20260601-cdp-{CAPTURE_LABEL}#map"),
    ("accessory-detail", shot_name("mobile-accessory-detail"), f"{BASE}&surface=shop-detail&place=accessoryShop&coins=500&r=20260601-cdp-{CAPTURE_LABEL}#map"),
    ("accessory-feedback", shot_name("mobile-accessory-feedback"), f"{BASE}&surface=shop-feedback&place=accessoryShop&coins=500&r=20260601-cdp-{CAPTURE_LABEL}#map"),
    ("princess-room-scene", shot_name("mobile-princess-room-scene"), f"{BASE}&surface=princess-room-scene&r=20260601-cdp-{CAPTURE_LABEL}#home"),
    ("wardrobe-detail", shot_name("mobile-wardrobe-detail"), f"{BASE}&surface=wardrobe-detail&category=outfit&r=20260601-cdp-{CAPTURE_LABEL}#home"),
    ("diary", shot_name("mobile-diary"), f"{BASE}&surface=diary&r=20260601-cdp-{CAPTURE_LABEL}#home"),
    ("settings", shot_name("mobile-settings"), f"{BASE}&surface=settings&r=20260601-cdp-{CAPTURE_LABEL}#home"),
    ("save-load", shot_name("mobile-save"), f"{BASE}&surface=save&r=20260601-cdp-{CAPTURE_LABEL}#home"),
]


class WebSocket:
    def __init__(self, url):
        parsed = urllib.parse.urlparse(url)
        self.sock = socket.create_connection((parsed.hostname, parsed.port), timeout=15)
        key = base64.b64encode(os.urandom(16)).decode("ascii")
        path = parsed.path
        if parsed.query:
            path += "?" + parsed.query
        request = (
            f"GET {path} HTTP/1.1\r\n"
            f"Host: {parsed.hostname}:{parsed.port}\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            "Sec-WebSocket-Version: 13\r\n\r\n"
        ).encode("ascii")
        self.sock.sendall(request)
        response = b""
        while b"\r\n\r\n" not in response:
            response += self.sock.recv(4096)
        if b" 101 " not in response.split(b"\r\n", 1)[0]:
            raise RuntimeError(response.decode("utf-8", "replace"))

    def send_json(self, payload):
        data = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        header = bytearray([0x81])
        if len(data) < 126:
            header.append(0x80 | len(data))
        elif len(data) < 65536:
            header.append(0x80 | 126)
            header.extend(struct.pack("!H", len(data)))
        else:
            header.append(0x80 | 127)
            header.extend(struct.pack("!Q", len(data)))
        mask = os.urandom(4)
        header.extend(mask)
        masked = bytes(byte ^ mask[index % 4] for index, byte in enumerate(data))
        self.sock.sendall(header + masked)

    def recv_json(self):
        chunks = []
        while True:
            first = self.sock.recv(2)
            if not first:
                raise RuntimeError("websocket closed")
            b1, b2 = first
            fin = bool(b1 & 0x80)
            opcode = b1 & 0x0F
            masked = bool(b2 & 0x80)
            length = b2 & 0x7F
            if length == 126:
                length = struct.unpack("!H", self._recv_exact(2))[0]
            elif length == 127:
                length = struct.unpack("!Q", self._recv_exact(8))[0]
            mask = self._recv_exact(4) if masked else b""
            payload = self._recv_exact(length)
            if masked:
                payload = bytes(byte ^ mask[index % 4] for index, byte in enumerate(payload))
            if opcode == 0x8:
                raise RuntimeError("websocket close frame")
            if opcode == 0x9:
                self._send_pong(payload)
                continue
            if opcode in (0x1, 0x0):
                chunks.append(payload)
                if fin:
                    return json.loads(b"".join(chunks).decode("utf-8"))

    def _send_pong(self, payload):
        self.sock.sendall(bytes([0x8A, len(payload)]) + payload)

    def _recv_exact(self, count):
        data = b""
        while len(data) < count:
            chunk = self.sock.recv(count - len(data))
            if not chunk:
                raise RuntimeError("socket closed")
            data += chunk
        return data

    def close(self):
        try:
            self.sock.close()
        except OSError:
            pass


class CDP:
    def __init__(self, ws_url):
        self.ws = WebSocket(ws_url)
        self.next_id = 0
        self.events = []

    def send(self, method, params=None, timeout=20):
        self.next_id += 1
        message_id = self.next_id
        self.ws.sock.settimeout(timeout)
        self.ws.send_json({"id": message_id, "method": method, "params": params or {}})
        while True:
            message = self.ws.recv_json()
            if message.get("id") == message_id:
                if "error" in message:
                    raise RuntimeError(f"{method}: {message['error']}")
                return message.get("result", {})
            self.events.append(message)

    def wait_event(self, method, timeout=20):
        deadline = time.time() + timeout
        self.ws.sock.settimeout(timeout)
        while time.time() < deadline:
            message = self.ws.recv_json()
            if message.get("method") == method:
                return message.get("params", {})
            self.events.append(message)
        raise TimeoutError(method)

    def close(self):
        self.ws.close()


def http_json(path, method="GET"):
    request = urllib.request.Request(f"http://127.0.0.1:{PORT}{path}", method=method)
    with urllib.request.urlopen(request, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


def wait_for_chrome():
    for _ in range(80):
        try:
            return http_json("/json/version")
        except Exception:
            time.sleep(0.25)
    raise RuntimeError("Chrome remote debugging port did not open")


def new_target():
    return http_json("/json/new", method="PUT")


def close_target(target_id):
    try:
        urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/close/{target_id}", timeout=5).read()
    except Exception:
        pass


def capture_surface(surface_id, file_name, url):
    target = new_target()
    cdp = CDP(target["webSocketDebuggerUrl"])
    out_path = os.path.join(QA_DIR, file_name)
    try:
        cdp.send("Emulation.setDeviceMetricsOverride", {
            "width": 390,
            "height": 844,
            "deviceScaleFactor": 1,
            "mobile": True,
        })
        cdp.send("Emulation.setUserAgentOverride", {
            "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        })
        cdp.send("Page.enable")
        cdp.send("Log.enable")
        cdp.send("Runtime.enable")
        cdp.send("Page.navigate", {"url": url})
        cdp.wait_event("Page.loadEventFired", timeout=20)
        cdp.send("Runtime.evaluate", {
            "expression": "new Promise(resolve => setTimeout(resolve, 900))",
            "awaitPromise": True,
        })
        metrics = cdp.send("Runtime.evaluate", {
            "expression": "({w: innerWidth, h: innerHeight, href: location.href, title: document.title, text: document.body.innerText.slice(0, 300)})",
            "returnByValue": True,
        })["result"]["value"]
        shot = cdp.send("Page.captureScreenshot", {
            "format": "png",
            "captureBeyondViewport": False,
            "fromSurface": True,
        }, timeout=30)
        with open(out_path, "wb") as handle:
            handle.write(base64.b64decode(shot["data"]))
        issues = []
        for event in cdp.events:
            if event.get("method") == "Runtime.exceptionThrown":
                issues.append({"method": event["method"], "params": event.get("params", {})})
            if event.get("method") == "Log.entryAdded":
                entry = event.get("params", {}).get("entry", {})
                if entry.get("level") in ("warning", "error"):
                    issues.append({"method": event["method"], "params": event.get("params", {})})
        return {
            "id": surface_id,
            "file": file_name,
            "path": out_path,
            "url": url,
            "exists": os.path.exists(out_path),
            "length": os.path.getsize(out_path) if os.path.exists(out_path) else 0,
            "metrics": metrics,
            "consoleIssues": issues,
            "tool": "chrome-cdp-fallback-after-iab-screenshot-timeout",
        }
    finally:
        cdp.close()
        close_target(target["id"])


def main():
    os.makedirs(QA_DIR, exist_ok=True)
    os.makedirs(PROFILE_DIR, exist_ok=True)
    chrome = subprocess.Popen([
        CHROME,
        "--headless=new",
        "--disable-gpu",
        "--disable-background-networking",
        "--no-first-run",
        "--hide-scrollbars",
        f"--remote-debugging-port={PORT}",
        f"--user-data-dir={PROFILE_DIR}",
        "about:blank",
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        wait_for_chrome()
        results = [capture_surface(*surface) for surface in SURFACES]
    finally:
        chrome.terminate()
        try:
            chrome.wait(timeout=5)
        except subprocess.TimeoutExpired:
            chrome.kill()
    log = {
        "capturedAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "reason": "Browser plugin iab was attempted first and produced screenshots earlier, but fresh recapture hit repeated Page.captureScreenshot timeouts on tabs 3 and 4.",
        "viewport": "390x844 via Emulation.setDeviceMetricsOverride",
        "captureLabel": CAPTURE_LABEL,
        "appPort": APP_PORT,
        "results": results,
    }
    log_name = "chrome-cdp-capture-results.json" if CAPTURE_LABEL == "after" else f"chrome-cdp-capture-results-{CAPTURE_LABEL}.json"
    log_path = os.path.join(QA_DIR, log_name)
    with open(log_path, "w", encoding="utf-8") as handle:
        json.dump(log, handle, ensure_ascii=False, indent=2)
    print(json.dumps({
        "count": len(results),
        "log": log_path,
        "widths": sorted(set(item["metrics"]["w"] for item in results)),
        "heights": sorted(set(item["metrics"]["h"] for item in results)),
        "consoleIssueCount": sum(len(item.get("consoleIssues", [])) for item in results),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
