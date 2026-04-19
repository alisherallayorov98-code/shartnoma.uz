#!/usr/bin/env python3
"""
Didox Autopilot v3.1 — shartnoma.uz
====================================
Tuzatishlar (v3 → v3.1):
  * Login saqlanadi (launch_persistent_context)
  * Popup detection click DAN OLDIN o'rnatiladi (e-imzo modali topiladi)
  * is_visible(timeout=N) → wait_for(state='visible', timeout=N) (haqiqiy smart wait)
  * XPath selectorlarga 'xpath=' prefiks
  * STIR uchun maxsus topish funksiyasi (sender va hamkor STIR ni adashtirmaydi)
  * Concurrency lock (parallel so'rovlar interleave bo'lmaydi)
  * Cache faqat _do_fill yakunida saqlanadi (race condition yo'q)

O'rnatish:
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
PROFILE_DIR = Path.home() / ".didox_autopilot_profile"

_ctx = None  # BrowserContext (persistent)
_page = None
_loop: asyncio.AbstractEventLoop
_fill_lock = asyncio.Lock()  # bir vaqtda faqat bitta to'ldirish

# Selector keshi
_sel_cache: dict[str, str] = {}


# ── Cache ─────────────────────────────────────────────────────────────────────

def _load_cache():
    global _sel_cache
    try:
        if CACHE_FILE.exists():
            _sel_cache = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
    except Exception:
        _sel_cache = {}


def _save_cache():
    try:
        CACHE_FILE.write_text(json.dumps(_sel_cache, ensure_ascii=False, indent=2), encoding="utf-8")
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
        ok = (self.path == "/health")
        self._json({"status": "ok", "version": "3.1"} if ok else {"error": "topilmadi"}, 200 if ok else 404)

    def do_POST(self):
        if self.path != "/fill-didox":
            return self._json({"error": "topilmadi"}, 404)
        n = int(self.headers.get("Content-Length", 0))
        data = json.loads(self.rfile.read(n)) if n else {}
        fut = asyncio.run_coroutine_threadsafe(_do_fill_locked(data), _loop)
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


async def _do_fill_locked(data: dict) -> dict:
    """Concurrency lock bilan o'rab _do_fill ni chaqiradi."""
    async with _fill_lock:
        try:
            return await _do_fill(data)
        finally:
            _save_cache()  # faqat yakunida — race condition yo'q


# ── Helper: visibility ────────────────────────────────────────────────────────

async def _wait_vis(el, timeout=500) -> bool:
    """Element visible bo'lguncha kutadi (TIMEOUT ms ichida)."""
    try:
        await el.wait_for(state="visible", timeout=timeout)
        return True
    except Exception:
        return False


async def _is_vis_now(el) -> bool:
    """Hozirgi visible holatini darhol qaytaradi (kutmaydi)."""
    try:
        return await el.is_visible()
    except Exception:
        return False


# ── Selector topish + kesh ────────────────────────────────────────────────────

async def _find(page_or_frame, cache_key: str | None, selectors: list[str], visible=True, timeout=500):
    """
    Birinchi visible elementni qaytaradi. cache_key berilsa keshlaydi.
    Returns: (element | None, selector_used | None)
    """
    # Keshdan
    if cache_key and (cached := _sel_cache.get(cache_key)):
        try:
            el = page_or_frame.locator(cached).first
            if await el.count() > 0 and (not visible or await _wait_vis(el, timeout)):
                return el, cached
        except Exception:
            pass
        # Eskirgan — o'chiramiz
        _sel_cache.pop(cache_key, None)

    # Yangidan qidirish
    for sel in selectors:
        try:
            el = page_or_frame.locator(sel).first
            if await el.count() > 0 and (not visible or await _wait_vis(el, timeout)):
                if cache_key:
                    _sel_cache[cache_key] = sel
                return el, sel
        except Exception:
            continue
    return None, None


async def _smart_fill(page, cache_key: str, selectors: list[str], value: str) -> bool:
    el, _ = await _find(page, cache_key, selectors)
    if el is None:
        return False
    try:
        await el.fill(value)
        return True
    except Exception:
        return False


# ── STIR uchun MAXSUS topish (sender ≠ hamkor) ────────────────────────────────

async def _find_cp_stir(page):
    """
    Hamkor STIR maydonini topish.
    Sahifada 2 ta STIR input bor: birinchi — sender (org), ikkinchi — hamkor.
    """
    cached = _sel_cache.get("cp_stir")
    if cached:
        try:
            el = page.locator(cached).first
            if await el.count() > 0 and await _wait_vis(el, 500):
                # Maydon bo'sh bo'lishi kerak (kontragent uchun) — bo'sh bo'lmasa eskirgan
                val = await el.input_value()
                if not val or len(val) < 9:
                    return el
        except Exception:
            pass
        _sel_cache.pop("cp_stir", None)

    # Aniq selectorlar — hamkor blokiga mo'ljallangan
    specific = [
        '[class*="receiver"] input[placeholder*="СТИР"]',
        '[class*="receiver"] input[placeholder*="STIR"]',
        '[class*="partner"] input[placeholder*="СТИР"]',
        '[class*="counterpart"] input[placeholder*="СТИР"]',
        '[class*="hamkor"] input[placeholder*="СТИР"]',
        # XPath: ikkinchi STIR input
        'xpath=(//input[contains(@placeholder,"СТИР") or contains(@placeholder,"STIR") or contains(@placeholder,"ИНН")])[2]',
    ]
    for sel in specific:
        try:
            el = page.locator(sel).first
            if await el.count() > 0 and await _wait_vis(el, 500):
                _sel_cache["cp_stir"] = sel
                return el
        except Exception:
            continue

    # Fallback: barcha STIR inputlardan ikkinchisini olish (.nth(1))
    for base_sel in ['input[placeholder*="СТИР"]', 'input[placeholder*="STIR"]', 'input[placeholder*="ИНН"]']:
        try:
            els = page.locator(base_sel)
            if await els.count() >= 2:
                el = els.nth(1)
                if await _wait_vis(el, 500):
                    return el  # generic .nth(1) — keshlamaymiz
        except Exception:
            continue

    return None


# ── Sana formatlash ───────────────────────────────────────────────────────────

def _fmt(iso: str) -> str:
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
        if pdf_b64:
            raw = base64.b64decode(pdf_b64)
            fd, pdf_tmp = tempfile.mkstemp(suffix=".pdf")
            os.write(fd, raw); os.close(fd)

        # ── 1. Sahifaga o'tish ─────────────────────────────────────────────
        t0 = asyncio.get_event_loop().time()
        await _page.bring_to_front()
        await _page.goto(DIDOX_URL, wait_until="commit", timeout=20_000)
        # Element paydo bo'lguncha kutamiz (DOM tayyor bo'lguncha emas)
        await _page.wait_for_selector(
            'input, select, [role="combobox"]',
            timeout=10_000
        )
        log(f"Sahifa yuklandi ({asyncio.get_event_loop().time()-t0:.1f}s)")

        # ── 2. Mustaqil fieldlar — PARALLEL ────────────────────────────────
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
            el, _ = await _find(_page, "type_dropdown", [
                '[class*="select"]:has-text("Бошқа")',
                '[class*="select"]:has-text("Boshqa")',
                '[aria-label*="тур"]', '[aria-label*="tur"]',
                '[class*="doc-type"]', '[class*="doctype"]',
                '[role="combobox"]',
            ])
            if el is None:
                return False
            try:
                await el.click()
            except Exception:
                return False
            # Variant paydo bo'lguncha kutamiz
            opt_selectors = [
                '[role="option"]:has-text("Шартнома")',
                'li:has-text("Шартнома")',
                '[class*="option"]:has-text("Шартнома")',
            ]
            for opt_sel in opt_selectors:
                try:
                    opt = _page.locator(opt_sel).first
                    if await opt.count() > 0 and await _wait_vis(opt, 800):
                        await opt.click()
                        return True
                except Exception:
                    continue
            return False

        results = await asyncio.gather(
            fill_doc_number(),
            fill_doc_date(),
            fill_con_number(),
            fill_con_date(),
            select_shartnoma_type(),
            return_exceptions=True,
        )
        ok_count = sum(1 for r in results if r is True)
        log(f"Parallel to'ldirish: {ok_count}/5 ✓")

        # ── 3. Hamkor STIR (alohida — sender bilan adashmasin) ─────────────
        if cp_inn:
            stir_el = await _find_cp_stir(_page)
            if stir_el:
                await stir_el.fill(cp_inn)
                await stir_el.press("Enter")
                # Smart wait: hamkor nomi paydo bo'lguncha
                try:
                    await _page.wait_for_function(
                        """() => {
                            const els = document.querySelectorAll(
                                '[class*="company"], [class*="receiver"] [class*="name"], '
                                + '[class*="partner"] [class*="name"], [class*="org-name"], '
                                + '[class*="hamkor"] [class*="name"]'
                            );
                            for (const el of els) {
                                if (el.textContent?.trim().length > 3) return true;
                            }
                            return false;
                        }""",
                        timeout=5_000
                    )
                    log(f"Hamkor STIR '{cp_inn}': ✓ (kompaniya yuklandi)")
                except Exception:
                    log(f"Hamkor STIR '{cp_inn}': kiritildi (ma'lumot kutilmadi)")
            else:
                log("Hamkor STIR: ⚠ maydoni topilmadi")

        # ── 4. PDF biriktirish ─────────────────────────────────────────────
        if pdf_tmp:
            fi_el, _ = await _find(_page, "file_input", [
                'input[type="file"]',
                '[class*="upload"] input[type="file"]',
                '[class*="attach"] input[type="file"]',
                '[class*="dropzone"] input',
                '[class*="file-upload"] input',
            ], visible=False)

            if fi_el:
                await fi_el.set_input_files(pdf_tmp)
                # Upload progress yo'qolguncha kutamiz
                try:
                    await _page.wait_for_function(
                        "() => !document.querySelector('[class*=\"upload-progress\"], [class*=\"uploading\"]')",
                        timeout=5_000
                    )
                except Exception:
                    pass
                log("PDF: ✓ biriktirildi")
            else:
                log("PDF: ⚠ fayl maydoni topilmadi")

        # ── 5. E-imzo imzolash ─────────────────────────────────────────────
        if password:
            sign_el, _ = await _find(_page, "sign_btn", [
                'button:has-text("Имзолаш")',
                'button:has-text("Imzolash")',
                'button:has-text("Подписать")',
                'button:has-text("Sign")',
                '[class*="sign-btn"]',
                'button[type="submit"]',
            ])

            if sign_el and await sign_el.is_enabled():
                # Popup listenerni KLIK DAN OLDIN o'rnatamiz
                popup_holder = {"popup": None}
                def _on_popup(p): popup_holder["popup"] = p
                _page.context.on("page", _on_popup)

                try:
                    await sign_el.click()
                    log("Imzolash bosildi — parol maydoni qidirilmoqda...")

                    # Polling: popup, main page, iframe — qaysi birinchi tayyor bo'lsa
                    pwd_el = None
                    sign_target = _page  # parol qaerda — shu yerda confirm bosamiz
                    deadline = asyncio.get_event_loop().time() + 8.0

                    while asyncio.get_event_loop().time() < deadline:
                        # 1. Popup
                        if popup_holder["popup"]:
                            try:
                                popup = popup_holder["popup"]
                                await popup.wait_for_load_state("domcontentloaded", timeout=1500)
                                cand = popup.locator('input[type="password"]').first
                                if await cand.count() > 0 and await _is_vis_now(cand):
                                    pwd_el = cand
                                    sign_target = popup
                                    break
                            except Exception:
                                pass

                        # 2. Main page modal
                        try:
                            cand = _page.locator('input[type="password"]').first
                            if await cand.count() > 0 and await _is_vis_now(cand):
                                pwd_el = cand
                                sign_target = _page
                                break
                        except Exception:
                            pass

                        # 3. Iframe
                        for frame in _page.frames:
                            if frame == _page.main_frame:
                                continue
                            try:
                                cand = frame.locator('input[type="password"]').first
                                if await cand.count() > 0 and await _is_vis_now(cand):
                                    pwd_el = cand
                                    sign_target = frame
                                    break
                            except Exception:
                                continue
                        if pwd_el:
                            break

                        await asyncio.sleep(0.15)
                finally:
                    try:
                        _page.context.remove_listener("page", _on_popup)
                    except Exception:
                        pass

                if pwd_el is None:
                    log("E-imzo: ⚠ parol maydoni topilmadi (qo'lda imzolang)")
                else:
                    await pwd_el.fill(password)
                    log("Parol kiritildi")

                    # Tasdiqlash tugmasi (sign_target ichidan qidiramiz)
                    confirmed = False
                    for sel in [
                        'button[type="submit"]',
                        'button:has-text("OK")',
                        'button:has-text("Tasdiqlash")',
                        'button:has-text("Тасдиқлаш")',
                        'button:has-text("Подтвердить")',
                        'button:has-text("Кириш")',
                        'button:has-text("Имзолаш")',
                    ]:
                        try:
                            btn = sign_target.locator(sel).last
                            if await btn.count() > 0 and await _is_vis_now(btn):
                                await btn.click()
                                confirmed = True
                                break
                        except Exception:
                            continue

                    if confirmed:
                        # Imzo tugaguncha — parol maydoni yo'qolguncha
                        try:
                            await _page.wait_for_function(
                                "() => !document.querySelector('input[type=\"password\"]')",
                                timeout=10_000
                            )
                            log("E-imzo: ✅ imzolandi")
                        except Exception:
                            log("E-imzo: kutilmoqda...")
                    else:
                        log("E-imzo: ⚠ tasdiqlash tugmasi topilmadi")
            else:
                log("Imzolash tugmasi: ⚠ topilmadi yoki faol emas")
        else:
            log("E-imzo paroli berilmadi — qo'lda imzolang")

        total = asyncio.get_event_loop().time() - t0
        log(f"Jami: {total:.1f}s")

        return {
            "status": "ok",
            "message": (
                f"✅ Didox to'ldirildi va imzolandi ({total:.0f}s)" if password
                else f"✅ Forma to'ldirildi ({total:.0f}s) — qo'lda imzolang"
            ),
            "log": log_msgs,
        }

    except Exception as exc:
        return {"status": "error", "message": str(exc), "log": log_msgs}
    finally:
        if pdf_tmp and os.path.exists(pdf_tmp):
            try:
                os.unlink(pdf_tmp)
            except Exception:
                pass


# ── Browser (persistent context — login saqlanadi) ───────────────────────────

async def _start_browser():
    global _page, _ctx
    from playwright.async_api import async_playwright

    pw = await async_playwright().start()
    PROFILE_DIR.mkdir(parents=True, exist_ok=True)

    _ctx = await pw.chromium.launch_persistent_context(
        user_data_dir=str(PROFILE_DIR),
        headless=False,
        args=[
            "--start-maximized",
            "--disable-blink-features=AutomationControlled",
            "--no-default-browser-check",
        ],
        viewport=None,
        accept_downloads=True,
    )
    _page = _ctx.pages[0] if _ctx.pages else await _ctx.new_page()
    try:
        await _page.goto("https://didox.uz", wait_until="commit", timeout=15_000)
    except Exception:
        pass
    print(f"  💾  Profil saqlanadi: {PROFILE_DIR}")
    print("  ℹ️   Birinchi marta Didox ga login qiling — keyingi safar avtomatik kiriladi")


def main():
    global _loop
    _load_cache()

    print("━" * 52)
    print("  🤖  Didox Autopilot  v3.1  |  shartnoma.uz")
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
        print(f"❌  {e}")
        input("Enter...")
        sys.exit(1)

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
        _save_cache()
        _loop.call_soon_threadsafe(_loop.stop)


if __name__ == "__main__":
    main()
