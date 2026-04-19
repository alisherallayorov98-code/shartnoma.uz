#!/usr/bin/env python3
"""
Didox Autopilot v1.0 — shartnoma.uz uchun yordamchi dastur
============================================================
Brauzer ochadi, STIR va PDF ni avtomatik to'ldiradi.

O'rnatish (bir marta):
  pip install playwright
  playwright install chromium

Ishga tushirish:
  python didox_autopilot.py

Keyin shartnoma.uz da "Autopilot" tugmasini bosing.
"""
import asyncio
import base64
import json
import os
import sys
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = 9876

_page = None
_browser = None
_loop: asyncio.AbstractEventLoop


# ── HTTP handler ──────────────────────────────────────────────────────────────

def _cors(h):
    h.send_header("Access-Control-Allow-Origin", "*")
    h.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    h.send_header("Access-Control-Allow-Headers", "Content-Type")


class _Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        _cors(self)
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            self._json({"status": "ok", "version": "1.0"})
        else:
            self._json({"error": "topilmadi"}, 404)

    def do_POST(self):
        if self.path != "/fill-didox":
            return self._json({"error": "topilmadi"}, 404)
        n = int(self.headers.get("Content-Length", 0))
        data = json.loads(self.rfile.read(n)) if n else {}
        fut = asyncio.run_coroutine_threadsafe(_do_fill(data), _loop)
        try:
            result = fut.result(timeout=60)
        except Exception as e:
            result = {"status": "error", "message": str(e)}
        self._json(result)

    def _json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", len(body))
        _cors(self)
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_):
        pass  # silent


# ── Playwright automation ─────────────────────────────────────────────────────

async def _do_fill(data: dict) -> dict:
    global _page
    cp_inn = data.get("cp_inn", "")
    pdf_b64 = data.get("pdf_base64")
    pdf_tmp = None

    try:
        # PDF ni vaqtinchalik faylga saqlash
        if pdf_b64:
            raw = base64.b64decode(pdf_b64)
            fd, pdf_tmp = tempfile.mkstemp(suffix=".pdf")
            os.write(fd, raw)
            os.close(fd)

        await _page.bring_to_front()
        await _page.goto(
            "https://didox.uz/document_form/000",
            wait_until="domcontentloaded",
            timeout=30_000,
        )
        await _page.wait_for_timeout(1500)

        # STIR maydonini topib to'ldirish
        stir_filled = False
        for sel in [
            'input[placeholder*="СТИР"]',
            'input[placeholder*="ИНН"]',
            'input[placeholder*="STIR"]',
            'input[name*="inn"]',
            'input[id*="inn"]',
            'input[class*="inn"]',
        ]:
            try:
                el = _page.locator(sel).first
                if await el.count() > 0:
                    await el.clear()
                    await el.type(cp_inn, delay=60)
                    await el.press("Enter")
                    await _page.wait_for_timeout(2500)
                    stir_filled = True
                    break
            except Exception:
                continue

        # PDF biriktirish
        if pdf_tmp:
            for sel in [
                'input[type="file"]',
                '[class*="upload"] input',
                '[class*="file"] input',
                '[class*="attach"] input',
            ]:
                try:
                    fi = _page.locator(sel).first
                    if await fi.count() > 0:
                        await fi.set_input_files(pdf_tmp)
                        await _page.wait_for_timeout(600)
                        break
                except Exception:
                    continue

        if stir_filled:
            msg = "Forma to'ldirildi — e-imzo bilan imzolang ✅"
        else:
            msg = "Didox ochildi (STIR maydon topilmadi — qo'lda to'ldiring)"

        return {"status": "ok", "message": msg}

    except Exception as exc:
        return {"status": "error", "message": str(exc)}

    finally:
        if pdf_tmp and os.path.exists(pdf_tmp):
            os.unlink(pdf_tmp)


async def _start_browser():
    global _page, _browser
    from playwright.async_api import async_playwright

    pw = await async_playwright().start()
    _browser = await pw.chromium.launch(
        headless=False,
        args=[
            "--start-maximized",
            "--disable-blink-features=AutomationControlled",
        ],
    )
    _page = await _browser.new_page()
    await _page.goto("about:blank")


# ── Asosiy funksiya ───────────────────────────────────────────────────────────

def main():
    global _loop

    print("━" * 48)
    print("  🤖  Didox Autopilot  v1.0  |  shartnoma.uz")
    print("━" * 48)

    # Playwright tekshirish
    try:
        import playwright  # noqa: F401
    except ImportError:
        print("\n❌  Playwright o'rnatilmagan.")
        print("    Buyruq:")
        print("      pip install playwright")
        print("      playwright install chromium\n")
        input("Enter bosib yoping...")
        sys.exit(1)

    # Asyncio loop — fon threadida
    _loop = asyncio.new_event_loop()
    t = threading.Thread(target=lambda: _loop.run_forever(), daemon=True)
    t.start()

    # Brauzer ishga tushirish
    print("\n⏳  Brauzer ochilmoqda...")
    fut = asyncio.run_coroutine_threadsafe(_start_browser(), _loop)
    try:
        fut.result(timeout=30)
    except Exception as e:
        print(f"\n❌  Brauzer xatosi: {e}\n")
        input("Enter bosib yoping...")
        sys.exit(1)

    print(f"✅  Brauzer tayyor")
    print(f"🌐  Server: http://127.0.0.1:{PORT}\n")
    print("   → shartnoma.uz da shartnomani oching")
    print("   → \"Autopilot\" tugmasini bosing")
    print("\n   To'xtatish: Ctrl+C\n")

    # HTTP server — asosiy thread (bloklovchi)
    server = HTTPServer(("127.0.0.1", PORT), _Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        print("\n👋  Yopildi.")
        _loop.call_soon_threadsafe(_loop.stop)


if __name__ == "__main__":
    main()
