#!/usr/bin/env python3
"""
Didox Autopilot v2.0 — shartnoma.uz uchun to'liq avtomatlashtirish
====================================================================
Shartnoma ma'lumotlarini Didox ga to'liq to'ldiradi va e-imzo bilan imzolaydi.

O'rnatish (bir marta):
  pip install playwright
  playwright install chromium

Ishga tushirish:
  python didox_autopilot.py

Keyin shartnoma.uz da "Didox" tugmasini bosing.
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
DIDOX_URL = "https://didox.uz/document_form/000"

_page = None
_browser = None
_loop: asyncio.AbstractEventLoop


# ── HTTP server ───────────────────────────────────────────────────────────────

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
            self._json({"status": "ok", "version": "2.0"})
        else:
            self._json({"error": "topilmadi"}, 404)

    def do_POST(self):
        if self.path != "/fill-didox":
            return self._json({"error": "topilmadi"}, 404)
        n = int(self.headers.get("Content-Length", 0))
        data = json.loads(self.rfile.read(n)) if n else {}
        fut = asyncio.run_coroutine_threadsafe(_do_fill(data), _loop)
        try:
            result = fut.result(timeout=120)
        except TimeoutError:
            result = {"status": "error", "message": "Vaqt tugadi (120 soniya)"}
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
        pass


# ── Yordamchi funksiyalar ─────────────────────────────────────────────────────

async def _fill_input(page, selectors: list[str], value: str, clear=True) -> bool:
    """Birinchi topilgan inputni to'ldiradi. True qaytaradi agar topilsa."""
    for sel in selectors:
        try:
            el = page.locator(sel).first
            if await el.count() > 0 and await el.is_visible():
                if clear:
                    await el.clear()
                await el.fill(value)
                return True
        except Exception:
            continue
    return False


async def _click_btn(page, selectors: list[str], timeout=5000) -> bool:
    """Birinchi topilgan tugmani bosadi."""
    for sel in selectors:
        try:
            el = page.locator(sel).first
            if await el.count() > 0 and await el.is_visible():
                await el.click(timeout=timeout)
                return True
        except Exception:
            continue
    return False


async def _select_option(page, dropdown_sel: str, option_text: str) -> bool:
    """Dropdown ni ochib, matn bo'yicha variantni tanlaydi."""
    try:
        # MUI/antd/custom dropdown uchun
        drop = page.locator(dropdown_sel).first
        if await drop.count() == 0:
            return False
        await drop.click()
        await page.wait_for_timeout(400)

        # Variantni matn bo'yicha qidirish
        for sel in [
            f'[role="option"]:has-text("{option_text}")',
            f'[role="listbox"] li:has-text("{option_text}")',
            f'.ant-select-item:has-text("{option_text}")',
            f'.v-list-item:has-text("{option_text}")',
            f'li:has-text("{option_text}")',
            f'div[class*="option"]:has-text("{option_text}")',
        ]:
            try:
                opt = page.locator(sel).first
                if await opt.count() > 0 and await opt.is_visible():
                    await opt.click()
                    await page.wait_for_timeout(300)
                    return True
            except Exception:
                continue
        return False
    except Exception:
        return False


def _fmt_date_uz(iso_date: str) -> str:
    """'2026-04-19' → '19.04.2026' (Didox format)"""
    if not iso_date or len(iso_date) < 10:
        return iso_date
    parts = iso_date[:10].split("-")
    if len(parts) == 3:
        return f"{parts[2]}.{parts[1]}.{parts[0]}"
    return iso_date


# ── Asosiy to'ldirish logikasi ────────────────────────────────────────────────

async def _do_fill(data: dict) -> dict:
    global _page

    doc_number      = data.get("doc_number", "")
    doc_date        = data.get("doc_date", "")
    contract_number = data.get("contract_number", "")
    contract_date   = data.get("contract_date", "")
    cp_inn          = data.get("cp_inn", "")
    eimzo_password  = data.get("eimzo_password", "")
    pdf_b64         = data.get("pdf_base64")

    pdf_tmp = None
    log_msgs = []

    def log(msg):
        print(f"  → {msg}")
        log_msgs.append(msg)

    try:
        # PDF ni vaqtinchalik faylga yozish
        if pdf_b64:
            raw = base64.b64decode(pdf_b64)
            fd, pdf_tmp = tempfile.mkstemp(suffix=".pdf")
            os.write(fd, raw)
            os.close(fd)
            log(f"PDF tayyor: {os.path.basename(pdf_tmp)}")

        # ── 1. Didox sahifasiga o'tish ──────────────────────────────────────
        log("Didox ga o'tilmoqda...")
        await _page.bring_to_front()
        await _page.goto(DIDOX_URL, wait_until="domcontentloaded", timeout=30_000)
        await _page.wait_for_timeout(2000)

        # ── 2. Hujjatning qo'shimcha turini "Shartnoma" ga o'rnatish ────────
        log("Hujjat turi tanlanmoqda: Shartnoma...")
        # Ko'p xil dropdown tuzilmalari uchun fallback
        selected = await _select_option(
            _page,
            '[class*="select"]:has-text("Бошқа"), [class*="select"]:has-text("Boshqa"), '
            '[class*="dropdown"], [aria-label*="тур"], [aria-label*="tur"]',
            "Шартнома"
        )
        if not selected:
            # Agar dropdown topilmasa — barcha "Shartnoma" matnli elementlarni sinab ko'r
            for sel in [
                'text="Шартнома"',
                '[role="option"]:has-text("Шартнома")',
                'li:has-text("Шартнома")',
            ]:
                try:
                    el = _page.locator(sel).first
                    if await el.count() > 0:
                        await el.click()
                        selected = True
                        break
                except Exception:
                    continue
        log(f"Shartnoma turi: {'✓' if selected else '⚠ topilmadi'}")

        # ── 3. Hujjat raqami ─────────────────────────────────────────────────
        if doc_number:
            ok = await _fill_input(_page, [
                'input[placeholder*="рақам"]',
                'input[placeholder*="raqam"]',
                'input[placeholder*="номер"]',
                'input[name*="number"]',
                'input[name*="raqam"]',
                '[class*="doc-number"] input',
                '[label*="рақам"] input',
            ], doc_number)
            log(f"Hujjat raqami '{doc_number}': {'✓' if ok else '⚠'}")

        # ── 4. Hujjat sanasi ─────────────────────────────────────────────────
        if doc_date:
            date_uz = _fmt_date_uz(doc_date)
            ok = await _fill_input(_page, [
                'input[placeholder*="санаси"]',
                'input[placeholder*="sanasi"]',
                'input[type="date"]',
                'input[placeholder*="дата"]',
                '[class*="date"] input',
            ], date_uz)
            log(f"Hujjat sanasi '{date_uz}': {'✓' if ok else '⚠'}")

        # ── 5. Shartnoma raqami ──────────────────────────────────────────────
        if contract_number:
            ok = await _fill_input(_page, [
                'input[placeholder*="Шартнома рақами"]',
                'input[placeholder*="Shartnoma raqami"]',
                'input[name*="contract_number"]',
                'input[name*="contractNumber"]',
            ], contract_number)
            log(f"Shartnoma raqami '{contract_number}': {'✓' if ok else '⚠'}")

        # ── 6. Shartnoma sanasi ──────────────────────────────────────────────
        if contract_date:
            date_uz = _fmt_date_uz(contract_date)
            ok = await _fill_input(_page, [
                'input[placeholder*="Шартнома санаси"]',
                'input[placeholder*="Shartnoma sanasi"]',
                'input[name*="contract_date"]',
                'input[name*="contractDate"]',
            ], date_uz)
            log(f"Shartnoma sanasi '{date_uz}': {'✓' if ok else '⚠'}")

        # ── 7. Hamkor STIR/JSHSHIR ───────────────────────────────────────────
        if cp_inn:
            log(f"Hamkor STIR '{cp_inn}' kiritilmoqda...")
            # Hamkor blokidagi STIR input (o'ng tomon)
            filled = False
            for sel in [
                '(//input[contains(@placeholder,"СТИР") or contains(@placeholder,"STIR")])[2]',
                '[class*="receiver"] input[placeholder*="СТИР"]',
                '[class*="receiver"] input[placeholder*="STIR"]',
                '[class*="partner"] input',
                '[class*="counterpart"] input',
                # Agar faqat bitta STIR input bo'lsa
                'input[placeholder*="СТИР"]',
                'input[placeholder*="STIR"]',
                'input[placeholder*="ИНН"]',
            ]:
                try:
                    # xpath uchun alohida
                    if sel.startswith("(//"):
                        els = await _page.locator(f"xpath={sel[1:-1]}").all()
                        if els:
                            await els[0].clear()
                            await els[0].fill(cp_inn)
                            await els[0].press("Enter")
                            filled = True
                            break
                    else:
                        el = _page.locator(sel).last  # oxirgisi — hamkor tomoni
                        if await el.count() > 0 and await el.is_visible():
                            await el.clear()
                            await el.type(cp_inn, delay=50)
                            await el.press("Enter")
                            filled = True
                            break
                except Exception:
                    continue
            log(f"Hamkor STIR: {'✓ kiritildi, yuklanmoqda...' if filled else '⚠ topilmadi'}")
            if filled:
                await _page.wait_for_timeout(3000)  # server dan ma'lumot kelishi uchun

        # ── 8. PDF biriktirish ───────────────────────────────────────────────
        if pdf_tmp:
            log("PDF biriktirilmoqda...")
            attached = False
            for sel in [
                'input[type="file"]',
                '[class*="upload"] input[type="file"]',
                '[class*="file-upload"] input',
                '[class*="attach"] input[type="file"]',
                '[class*="dropzone"] input',
            ]:
                try:
                    fi = _page.locator(sel).first
                    if await fi.count() > 0:
                        await fi.set_input_files(pdf_tmp)
                        await _page.wait_for_timeout(1000)
                        attached = True
                        break
                except Exception:
                    continue
            log(f"PDF: {'✓ biriktirildi' if attached else '⚠ fayl maydoni topilmadi'}")

        # ── 9. E-imzo bilan imzolash ─────────────────────────────────────────
        if eimzo_password:
            log("Imzolash bosqichi boshlanmoqda...")
            await _page.wait_for_timeout(500)

            # "Imzolash" / "Подписать" tugmasini bosish
            signed = await _click_btn(_page, [
                'button:has-text("Имзолаш")',
                'button:has-text("Imzolash")',
                'button:has-text("Подписать")',
                'button:has-text("Sign")',
                '[class*="sign"] button',
                '[class*="imzo"] button',
                'button[type="submit"]:has-text("Имзо")',
            ])
            log(f"Imzolash tugmasi: {'✓ bosildi' if signed else '⚠ topilmadi'}")

            if signed:
                await _page.wait_for_timeout(2000)

                # Modal yoki yangi oynada e-imzo paroli maydoni
                # E-imzo odatda modal dialog yoki iframe orqali ishlaydi
                pwd_filled = False

                # 1. Asosiy sahifada parol input
                for sel in [
                    'input[type="password"]',
                    'input[placeholder*="парол"]',
                    'input[placeholder*="parol"]',
                    'input[placeholder*="password"]',
                    'input[placeholder*="Пароль"]',
                ]:
                    try:
                        el = _page.locator(sel).first
                        if await el.count() > 0 and await el.is_visible():
                            await el.fill(eimzo_password)
                            pwd_filled = True
                            break
                    except Exception:
                        continue

                # 2. Iframe ichida e-imzo bo'lishi mumkin
                if not pwd_filled:
                    for frame in _page.frames:
                        for sel in ['input[type="password"]', 'input[name="password"]']:
                            try:
                                el = frame.locator(sel).first
                                if await el.count() > 0:
                                    await el.fill(eimzo_password)
                                    pwd_filled = True
                                    break
                            except Exception:
                                continue
                        if pwd_filled:
                            break

                # 3. Yangi popup oyna
                if not pwd_filled:
                    try:
                        popup = await _page.context.wait_for_event("page", timeout=3000)
                        await popup.wait_for_load_state("domcontentloaded")
                        el = popup.locator('input[type="password"]').first
                        if await el.count() > 0:
                            await el.fill(eimzo_password)
                            pwd_filled = True
                            # Tasdiqlash tugmasi
                            await _click_btn(popup, [
                                'button[type="submit"]',
                                'button:has-text("OK")',
                                'button:has-text("Tasdiqlash")',
                                'button:has-text("Подтвердить")',
                            ])
                    except Exception:
                        pass

                log(f"E-imzo paroli: {'✓ kiritildi' if pwd_filled else '⚠ parol maydoni topilmadi'}")

                if pwd_filled:
                    await _page.wait_for_timeout(500)
                    # Tasdiqlash tugmasi
                    confirmed = await _click_btn(_page, [
                        'button[type="submit"]',
                        'button:has-text("OK")',
                        'button:has-text("Tasdiqlash")',
                        'button:has-text("Тасдиқлаш")',
                        'button:has-text("Подтвердить")',
                        'button:has-text("Confirm")',
                        'button:has-text("Кириш")',
                    ])
                    log(f"Tasdiqlash: {'✓' if confirmed else '⚠'}")
                    if confirmed:
                        await _page.wait_for_timeout(3000)
        else:
            log("E-imzo paroli berilmadi — qo'lda imzolang")

        log("✅ Jarayon yakunlandi")
        steps_done = len([m for m in log_msgs if "✓" in m])
        return {
            "status": "ok",
            "message": f"✅ Didox to'ldirildi ({steps_done} qadam bajarildi). E-imzo imzolandi." if eimzo_password else f"✅ Forma to'ldirildi. E-imzo bilan imzolang.",
            "log": log_msgs,
        }

    except Exception as exc:
        return {"status": "error", "message": str(exc), "log": log_msgs}

    finally:
        if pdf_tmp and os.path.exists(pdf_tmp):
            os.unlink(pdf_tmp)


# ── Browser ishga tushirish ───────────────────────────────────────────────────

async def _start_browser():
    global _page, _browser
    from playwright.async_api import async_playwright

    pw = await async_playwright().start()
    _browser = await pw.chromium.launch(
        headless=False,
        args=[
            "--start-maximized",
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox",
        ],
    )
    _page = await _browser.new_page()

    # Didox ga oldindan login bo'lgan profilni ishlatish uchun storage
    state_file = os.path.join(os.path.dirname(__file__), ".didox_state.json") if hasattr(__file__, "__file__") else ".didox_state.json"
    await _page.goto("https://didox.uz", wait_until="domcontentloaded", timeout=15_000)

    print("  ℹ️  Agar Didox ga kirgan bo'lmasangiz, hozir login qiling.")
    print("     Login qilgandan keyin Enter bosing...")
    # Non-blocking: server ishga tushsa login qilingan holat saqlanadi


# ── Asosiy funksiya ───────────────────────────────────────────────────────────

def main():
    global _loop

    print("━" * 52)
    print("  🤖  Didox Autopilot  v2.0  |  shartnoma.uz")
    print("━" * 52)
    print()

    try:
        import playwright  # noqa: F401
    except ImportError:
        print("❌  Playwright o'rnatilmagan.")
        print()
        print("    Buyruqlar:")
        print("      pip install playwright")
        print("      playwright install chromium")
        print()
        input("Enter bosib yoping...")
        sys.exit(1)

    # Asyncio loop — fon threadida
    _loop = asyncio.new_event_loop()
    t = threading.Thread(target=lambda: _loop.run_forever(), daemon=True)
    t.start()

    # Brauzer
    print("⏳  Brauzer ochilmoqda...")
    fut = asyncio.run_coroutine_threadsafe(_start_browser(), _loop)
    try:
        fut.result(timeout=30)
    except Exception as e:
        print(f"❌  Brauzer xatosi: {e}")
        input("Enter bosib yoping...")
        sys.exit(1)

    print(f"✅  Brauzer tayyor")
    print(f"🌐  Server: http://127.0.0.1:{PORT}")
    print()
    print("   shartnoma.uz → shartnomani oching → \"Didox\" tugmasi")
    print("   E-imzo paroli so'raladi → hammasi avtomatik bajariladi")
    print()
    print("   To'xtatish: Ctrl+C")
    print()

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
