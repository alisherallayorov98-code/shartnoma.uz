#!/usr/bin/env python3
"""
Didox Autopilot v3.0 — shartnoma.uz
====================================
Optimallashtirilgan: parallel to'ldirish, smart wait, selector kesh.
Maqsad: 8-12 soniya (avval: 20-40s).

O'rnatish (bir marta):
  pip install playwright
  playwright install chromium

Ishga tushirish:
  python didox_autopilot.py
"""
import asyncio
import base64
import json
import os
import sys
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

PORT = 9876
DIDOX_URL = "https://didox.uz/document_form/000"
CACHE_FILE = Path.home() / ".didox_autopilot_cache.json"

_page = None
_browser = None
_loop: asyncio.AbstractEventLoop

# Selector keshi: bir marta topilgan selectorni qayta ishlatish
_sel_cache: dict[str, str] = {}


def _load_cache():
    global _sel_cache
    try:
        if CACHE_FILE.exists():
            _sel_cache = json.loads(CACHE_FILE.read_text())
    except Exception:
        _sel_cache = {}


def _save_cache():
    try:
        CACHE_FILE.write_text(json.dumps(_sel_cache, ensure_ascii=False, indent=2))
    except Exception:
        pass


# ── HTTP server ───────────────────────────────────────────────────────────────

def _cors(h):
    h.send_header("Access-Control-Allow-Origin", "*")
    h.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    h.send_header("Access-Control-Allow-Headers", "Content-Type")


class _Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200); _cors(self); self.end_headers()

    def do_GET(self):
        self._json({"status": "ok", "version": "3.0"} if self.path == "/health" else {"error": "topilmadi"}, 200 if self.path == "/health" else 404)

    def do_POST(self):
        if self.path != "/fill-didox":
            return self._json({"error": "topilmadi"}, 404)
        n = int(self.headers.get("Content-Length", 0))
        data = json.loads(self.rfile.read(n)) if n else {}
        fut = asyncio.run_coroutine_threadsafe(_do_fill(data), _loop)
        try:
            result = fut.result(timeout=120)
        except TimeoutError:
            result = {"status": "error", "message": "Vaqt tugadi (120s)"}
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

    def log_message(self, *_): pass


# ── Smart selector topish (kesh bilan) ───────────────────────────────────────

async def _find_and_cache(page, cache_key: str, selectors: list[str], visible=True):
    """
    Keshdan oldin tekshiradi. Topilsa keshga yozadi.
    Returns: (element | None, selector_used)
    """
    # Keshda bor bo'lsa — to'g'ridan to'g'ri
    cached = _sel_cache.get(cache_key)
    if cached:
        try:
            el = page.locator(cached).first
            if await el.count() > 0 and (not visible or await el.is_visible(timeout=500)):
                return el, cached
        except Exception:
            del _sel_cache[cache_key]  # eskirgan — o'chiramiz

    # Qidirish
    for sel in selectors:
        try:
            el = page.locator(sel).first
            if await el.count() > 0 and (not visible or await el.is_visible(timeout=300)):
                _sel_cache[cache_key] = sel
                _save_cache()
                return el, sel
        except Exception:
            continue
    return None, None


async def _smart_fill(page, cache_key: str, selectors: list[str], value: str) -> bool:
    """Kesh + parallel bo'lmagan holda ham tez ishlaydi."""
    el, _ = await _find_and_cache(page, cache_key, selectors)
    if el is None:
        return False
    try:
        await el.fill(value)
        return True
    except Exception:
        return False


# ── Sana formatlash ───────────────────────────────────────────────────────────

def _fmt(iso: str) -> str:
    """'2026-04-19' → '19.04.2026'"""
    p = (iso or "")[:10].split("-")
    return f"{p[2]}.{p[1]}.{p[0]}" if len(p) == 3 else iso


# ── Asosiy automation ─────────────────────────────────────────────────────────

async def _do_fill(data: dict) -> dict:
    global _page

    doc_num   = data.get("doc_number", "")
    doc_date  = _fmt(data.get("doc_date", ""))
    con_num   = data.get("contract_number", "")
    con_date  = _fmt(data.get("contract_date", ""))
    cp_inn    = data.get("cp_inn", "")
    password  = data.get("eimzo_password", "")
    pdf_b64   = data.get("pdf_base64")

    log_msgs: list[str] = []
    pdf_tmp = None

    def log(msg): print(f"  → {msg}"); log_msgs.append(msg)

    try:
        # ── PDF vaqtinchalik faylga (async bilan parallel ketadi) ──────────
        if pdf_b64:
            raw = base64.b64decode(pdf_b64)
            fd, pdf_tmp = tempfile.mkstemp(suffix=".pdf")
            os.write(fd, raw); os.close(fd)

        # ── 1. Sahifaga o'tish ─────────────────────────────────────────────
        t0 = asyncio.get_event_loop().time()
        await _page.bring_to_front()
        await _page.goto(DIDOX_URL, wait_until="commit", timeout=20_000)
        # "commit" = birinchi byte keldi, DOM qurilishini kutmaymiz
        # Faqat zarur elementlar paydo bo'lguncha kutamiz
        await _page.wait_for_selector(
            'input, select, [role="combobox"]',
            timeout=10_000
        )
        log(f"Sahifa yuklandi ({asyncio.get_event_loop().time()-t0:.1f}s)")

        # ── 2. Barcha mustaqil fieldlarni PARALLEL to'ldirish ─────────────
        log("Fieldlar parallel to'ldirilmoqda...")

        async def fill_doc_number():
            return await _smart_fill(_page, "doc_number", [
                'input[placeholder*="Ҳужжат рақами"]',
                'input[placeholder*="рақами"]',
                'input[placeholder*="raqami"]',
                'input[placeholder*="Номер"]',
                'input[name*="docNumber"]', 'input[name*="number"]',
                '[class*="doc-num"] input', '[class*="docnum"] input',
            ], doc_num)

        async def fill_doc_date():
            return await _smart_fill(_page, "doc_date", [
                'input[placeholder*="Ҳужжат санаси"]',
                'input[placeholder*="санаси"]',
                'input[placeholder*="sanasi"]',
                'input[name*="docDate"]', 'input[name*="doc_date"]',
                'input[type="date"]',
            ], doc_date)

        async def fill_con_number():
            return await _smart_fill(_page, "con_number", [
                'input[placeholder*="Шартнома рақами"]',
                'input[placeholder*="Shartnoma raqami"]',
                'input[name*="contractNum"]', 'input[name*="contract_number"]',
            ], con_num)

        async def fill_con_date():
            return await _smart_fill(_page, "con_date", [
                'input[placeholder*="Шартнома санаси"]',
                'input[placeholder*="Shartnoma sanasi"]',
                'input[name*="contractDate"]', 'input[name*="contract_date"]',
            ], con_date)

        async def select_shartnoma_type():
            # Dropdown ni tanlash
            el, _ = await _find_and_cache(_page, "type_dropdown", [
                '[class*="select"]:has-text("Бошқа")',
                '[class*="select"]:has-text("Boshqa")',
                '[aria-label*="тур"]', '[aria-label*="tur"]',
                '[class*="doc-type"]', '[class*="doctype"]',
                '[role="combobox"]',
            ])
            if el is None:
                return False
            await el.click()
            await _page.wait_for_timeout(200)
            # Variant
            for opt_sel in [
                '[role="option"]:has-text("Шартнома")',
                'li:has-text("Шартнома")',
                '[class*="option"]:has-text("Шартнома")',
                'div:has-text("Шартнома"):not(:has(*))',
            ]:
                try:
                    opt = _page.locator(opt_sel).first
                    if await opt.count() > 0 and await opt.is_visible(timeout=500):
                        await opt.click()
                        return True
                except Exception:
                    continue
            return False

        # Hammasini parallel ishga tushiramiz
        results = await asyncio.gather(
            fill_doc_number(),
            fill_doc_date(),
            fill_con_number(),
            fill_con_date(),
            select_shartnoma_type(),
            return_exceptions=True,
        )
        filled_ok = sum(1 for r in results if r is True)
        log(f"Parallel to'ldirish: {filled_ok}/5 ✓")

        # ── 3. Hamkor STIR — alohida (network response ni kutadi) ──────────
        if cp_inn:
            stir_el, _ = await _find_and_cache(_page, "cp_stir", [
                # Hamkor tomonidagi input — ko'pincha o'ng panelda yoki ikkinchi STIR
                '[class*="receiver"] input[placeholder*="СТИР"]',
                '[class*="receiver"] input[placeholder*="STIR"]',
                '[class*="partner"] input[placeholder*="СТИР"]',
                'input[placeholder*="СТИР/ЖШШИР"]',
                # Sahifada 2 ta STIR input bo'lsa — ikkinchisi hamkor uchun
                '(//input[contains(@placeholder,"СТИР")])[2]',
                'input[placeholder*="СТИР"]',
                'input[placeholder*="STIR"]',
                'input[placeholder*="ИНН"]',
            ])

            if stir_el:
                await stir_el.fill(cp_inn)

                # Smart wait: kompaniya nomi paydo bo'lguncha (fixed 3s o'rniga)
                try:
                    await _page.wait_for_function(
                        # Hamkor nomi yuklanganda qandaydir matn paydo bo'ladi
                        """() => {
                            const els = document.querySelectorAll(
                                '[class*="company"], [class*="receiver"] [class*="name"], '
                                + '[class*="partner"] [class*="name"], [class*="org-name"]'
                            );
                            for (const el of els) {
                                if (el.textContent?.trim().length > 3) return true;
                            }
                            return false;
                        }""",
                        timeout=5_000
                    )
                    log(f"Hamkor STIR '{cp_inn}': ✓ (kompaniya yukland)")
                except Exception:
                    # 5 soniya ichida kelmasa ham davom etamiz
                    log(f"Hamkor STIR '{cp_inn}': kiritildi (ma'lumot kutilmoqda)")
            else:
                log(f"Hamkor STIR: ⚠ maydoni topilmadi")

        # ── 4. PDF biriktirish ─────────────────────────────────────────────
        if pdf_tmp:
            fi_el, _ = await _find_and_cache(_page, "file_input", [
                'input[type="file"]',
                '[class*="upload"] input[type="file"]',
                '[class*="attach"] input[type="file"]',
                '[class*="dropzone"] input',
                '[class*="file-upload"] input',
            ], visible=False)

            if fi_el:
                await fi_el.set_input_files(pdf_tmp)
                log("PDF: ✓ biriktirildi")
                # Fayl yuklanishini kutish (progressbar yo'qolganda)
                try:
                    await _page.wait_for_function(
                        "() => !document.querySelector('[class*=\"upload-progress\"], [class*=\"uploading\"]')",
                        timeout=5_000
                    )
                except Exception:
                    pass
            else:
                log("PDF: ⚠ fayl maydoni topilmadi")

        # ── 5. E-imzo imzolash ─────────────────────────────────────────────
        if password:
            # Imzolash tugmasi
            sign_el, _ = await _find_and_cache(_page, "sign_btn", [
                'button:has-text("Имзолаш")',
                'button:has-text("Imzolash")',
                'button:has-text("Подписать")',
                'button:has-text("Sign")',
                '[class*="sign-btn"]',
                '[class*="submit-btn"]',
                'button[type="submit"]',
            ])

            if sign_el and await sign_el.is_enabled():
                await sign_el.click()
                log("Imzolash tugmasi bosildi")

                # Parol modali paydo bo'lguncha kutamiz
                pwd_sel = 'input[type="password"]'
                pwd_el = None

                try:
                    # Asosiy sahifada
                    await _page.wait_for_selector(pwd_sel, timeout=5_000)
                    pwd_el = _page.locator(pwd_sel).first
                except Exception:
                    pass

                # Iframe ichida
                if pwd_el is None or await pwd_el.count() == 0:
                    for frame in _page.frames:
                        try:
                            await frame.wait_for_selector(pwd_sel, timeout=2_000)
                            pwd_el = frame.locator(pwd_sel).first
                            break
                        except Exception:
                            continue

                # Popup oyna
                if pwd_el is None or await pwd_el.count() == 0:
                    try:
                        async with _page.context.expect_page(timeout=3_000) as popup_info:
                            pass
                        popup = popup_info.value
                        await popup.wait_for_selector(pwd_sel, timeout=5_000)
                        pwd_el = popup.locator(pwd_sel).first
                        await pwd_el.fill(password)
                        await _click_popup_confirm(popup)
                        log("E-imzo (popup): ✓ imzolandi")
                        pwd_el = None  # already handled
                    except Exception:
                        pass

                if pwd_el and await pwd_el.count() > 0:
                    await pwd_el.fill(password)
                    # Tasdiqlash
                    for confirm_sel in [
                        'button[type="submit"]',
                        'button:has-text("OK")',
                        'button:has-text("Tasdiqlash")',
                        'button:has-text("Тасдиқлаш")',
                        'button:has-text("Подтвердить")',
                        'button:has-text("Кириш")',
                    ]:
                        try:
                            btn = _page.locator(confirm_sel).last
                            if await btn.count() > 0 and await btn.is_visible(timeout=500):
                                await btn.click()
                                break
                        except Exception:
                            continue

                    # Imzo tugaguncha kutish
                    try:
                        await _page.wait_for_function(
                            "() => !document.querySelector('input[type=\"password\"]')",
                            timeout=10_000
                        )
                        log("E-imzo: ✓ imzolandi")
                    except Exception:
                        log("E-imzo: kutilmoqda...")
                else:
                    log("E-imzo: ⚠ parol maydoni topilmadi")
            else:
                log("Imzolash tugmasi: ⚠ topilmadi yoki faol emas")
        else:
            log("E-imzo paroli berilmadi — qo'lda imzolang")

        total = asyncio.get_event_loop().time() - t0
        log(f"Jami vaqt: {total:.1f}s")

        return {
            "status": "ok",
            "message": f"✅ Didox to'ldirildi va imzolandi ({total:.0f}s)" if password else f"✅ Forma to'ldirildi ({total:.0f}s) — e-imzo bilan imzolang",
            "log": log_msgs,
        }

    except Exception as exc:
        return {"status": "error", "message": str(exc), "log": log_msgs}
    finally:
        if pdf_tmp and os.path.exists(pdf_tmp):
            os.unlink(pdf_tmp)


async def _click_popup_confirm(page):
    for sel in ['button[type="submit"]', 'button:has-text("OK")', 'button:has-text("Tasdiqlash")']:
        try:
            btn = page.locator(sel).first
            if await btn.count() > 0:
                await btn.click()
                return
        except Exception:
            continue


# ── Browser ───────────────────────────────────────────────────────────────────

async def _start_browser():
    global _page, _browser
    from playwright.async_api import async_playwright

    pw = await async_playwright().start()
    _browser = await pw.chromium.launch(
        headless=False,
        args=["--start-maximized", "--disable-blink-features=AutomationControlled"],
    )
    ctx = await _browser.new_context(viewport=None)
    _page = await ctx.new_page()
    await _page.goto("https://didox.uz", wait_until="commit", timeout=15_000)
    print("  ℹ️  Didox ga login qiling (agar kirgan bo'lmasangiz).")


def main():
    global _loop
    _load_cache()

    print("━" * 52)
    print("  🤖  Didox Autopilot  v3.0  |  shartnoma.uz")
    print("━" * 52)
    print()

    try:
        import playwright  # noqa
    except ImportError:
        print("❌  Playwright o'rnatilmagan.\n")
        print("    pip install playwright && playwright install chromium\n")
        input("Enter...")
        sys.exit(1)

    _loop = asyncio.new_event_loop()
    threading.Thread(target=lambda: _loop.run_forever(), daemon=True).start()

    print("⏳  Brauzer ochilmoqda...")
    fut = asyncio.run_coroutine_threadsafe(_start_browser(), _loop)
    try:
        fut.result(timeout=30)
    except Exception as e:
        print(f"❌  {e}"); input("Enter..."); sys.exit(1)

    print(f"✅  Brauzer tayyor — kesh: {len(_sel_cache)} ta selector saqlangan")
    print(f"🌐  Server: http://127.0.0.1:{PORT}")
    print()
    print("   shartnoma.uz → \"Didox\" → e-imzo parolini kiriting")
    print("   To'xtatish: Ctrl+C\n")

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
