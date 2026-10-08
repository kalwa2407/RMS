/**
 * PrintService.js
 * ─────────────────────────────────────────────────────────────
 * Handles bill printing for Persian Darbar POS
 *
 * Three printing modes (tried in order for "auto"):
 *   1. Web Serial API – ESC/POS direct to USB/Serial thermal printer (Chrome/Edge)
 *   2. QZ Tray        – Java-based middleware; silent, no browser dialog
 *   3. window.print() – Universal browser dialog fallback (always works)
 *
 * Storage key  :  pd_print_mode  →  "auto" | "manual"
 * ─────────────────────────────────────────────────────────────
 */

import logoImg from "../assets/logo.png";

// ── ESC/POS byte helpers ──────────────────────────────────────────────────────
const ESC  = 0x1b;
const GS   = 0x1d;

const INIT          = [ESC, 0x40];
const ALIGN_CENTER  = [ESC, 0x61, 0x01];
const ALIGN_LEFT    = [ESC, 0x61, 0x00];
const BOLD_ON       = [ESC, 0x45, 0x01];
const BOLD_OFF      = [ESC, 0x45, 0x00];
const FONT_2X       = [GS,  0x21, 0x11];  // double width + height
const FONT_NORMAL   = [GS,  0x21, 0x00];
const CUT_PAPER     = [GS,  0x56, 0x41, 0x10];  // partial cut

function textBytes(str) {
  return Array.from(new TextEncoder().encode(str));
}

function buildEscPosReceipt(order, billNo) {
  const bytes = [];
  const push = (...chunks) => chunks.forEach(c => bytes.push(...c));
  const text = (str) => push(textBytes(str + "\n"));

  push(INIT);

  // Header
  push(ALIGN_CENTER, BOLD_ON, FONT_2X);
  text("PERSIAN DARBAR");
  push(FONT_NORMAL, BOLD_OFF);
  text("THE TASTE OF HINDUSTAN");
  text("Camp, Pune, MH 411004");
  text("Ph: +91 9594287868");
  text("GSTIN: 27XXXXX1234X1Z5");
  push(BOLD_ON);
  text("--------------------------------");
  push(BOLD_OFF);

  // Bill info
  push(ALIGN_LEFT);
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });
  text(`Bill No : ${billNo}`);
  text(`Date    : ${dateStr}  ${timeStr}`);
  text(`Customer: ${order.customer_name || "Guest"}`);
  if (order.phone) text(`Phone   : ${order.phone}`);
  if (order.address) text(`Addr    : ${order.address.substring(0, 32)}`);
  text(`Type    : ${(order.order_type || "online").replace("_","-").toUpperCase()}`);

  push(BOLD_ON);
  text("--------------------------------");
  text("ITEM                   QTY  AMT");
  text("--------------------------------");
  push(BOLD_OFF);

  (order.items || []).forEach(item => {
    const name = (item.name || "Item").substring(0, 20).padEnd(20);
    const qty  = String(item.quantity || 1).padStart(4);
    const amt  = String(Math.round((item.price * (item.quantity || 1)))).padStart(6);
    text(`${name}${qty} ${amt}`);
  });

  push(BOLD_ON);
  text("--------------------------------");
  push(BOLD_OFF);

  const sub = (order.subtotal     || 0).toFixed(2);
  const tax = (order.taxes        || 0).toFixed(2);
  const del = (order.delivery_fee || 0).toFixed(2);
  const tot = (order.total        || 0).toFixed(2);

  text(`Subtotal           : Rs ${sub}`);
  if (parseFloat(tax) > 0) text(`GST (5%)           : Rs ${tax}`);
  if (parseFloat(del) > 0) text(`Delivery Fee       : Rs ${del}`);
  push(BOLD_ON, FONT_2X);
  text(`TOTAL              : Rs ${tot}`);
  push(FONT_NORMAL, BOLD_OFF);

  text("--------------------------------");
  push(ALIGN_CENTER);
  text("");
  text("Thank you for your order!");
  text("www.persiandarbar.in");
  text("");
  text("");
  push(CUT_PAPER);

  return new Uint8Array(bytes);
}

// ── Web Serial API ────────────────────────────────────────────────────────────
let _serialPort = null;

export async function connectSerialPrinter() {
  if (!("serial" in navigator)) {
    return { success: false, error: "Web Serial API not supported. Use Chrome or Edge browser." };
  }
  try {
    _serialPort = await navigator.serial.requestPort();
    await _serialPort.open({ baudRate: 9600 });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function getSerialPort() { return _serialPort; }

/** Returns true if a serial printer is currently connected and writable */
export function isSerialPrinterConnected() {
  return !!(_serialPort && _serialPort.writable);
}

async function printViaSerial(data) {
  if (!_serialPort || !_serialPort.writable) return false;
  try {
    const writer = _serialPort.writable.getWriter();
    await writer.write(data);
    writer.releaseLock();
    return true;
  } catch { return false; }
}

// ── QZ Tray ───────────────────────────────────────────────────────────────────
let _qzAvailable = null;

export async function checkQzTray() {
  if (_qzAvailable !== null) return _qzAvailable;
  return new Promise(resolve => {
    try {
      const ws = new WebSocket("wss://localhost:8181");
      const timer = setTimeout(() => { ws.close(); _qzAvailable = false; resolve(false); }, 2000);
      ws.onopen = () => {
        clearTimeout(timer);
        ws.close();
        _qzAvailable = true;
        resolve(true);
      };
      ws.onerror = () => {
        clearTimeout(timer);
        _qzAvailable = false;
        resolve(false);
      };
    } catch {
      _qzAvailable = false;
      resolve(false);
    }
  });
}

// ── Logo helper ───────────────────────────────────────────────────────────────
export function getLogoBase64() {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve("");
    img.src = logoImg;
  });
}

// ── Build HTML receipt ────────────────────────────────────────────────────────
export async function buildReceiptHtml(order, billNo) {
  const logoBase64 = await getLogoBase64();
  const logoHtml   = logoBase64
    ? `<img src="${logoBase64}" style="width:64px;height:64px;object-fit:contain;margin-bottom:3px;" /><br/>`
    : "";

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });

  const items    = order.items || [];
  const subtotal = (order.subtotal     || 0).toFixed(2);
  const taxes    = (order.taxes        || 0).toFixed(2);
  const delFee   = (order.delivery_fee || 0).toFixed(2);
  const total    = (order.total        || 0).toFixed(2);
  const discount = (order.discount     || 0).toFixed(2);

  return `<!DOCTYPE html><html><head>
    <title>Bill - ${billNo}</title>
    <style>
      @page { size: 80mm auto; margin: 4mm; }
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Courier New',Courier,monospace; font-size:11px; width:72mm; color:#000; }
      .center { text-align:center; }
      .bold   { font-weight:bold; }
      .dashed { border-top:1px dashed #000; margin:5px 0; }
      .solid  { border-top:2px solid #000; margin:5px 0; }
      .row    { display:flex; justify-content:space-between; }
      .row-3  { display:flex; }
      .row-3 .col-name { flex:1; }
      .row-3 .col-qty  { width:28px; text-align:center; }
      .row-3 .col-amt  { width:52px; text-align:right; }
      .brand  { font-size:17px; font-weight:bold; letter-spacing:1.5px; }
      .tag    { font-size:9px; letter-spacing:1px; margin-bottom:2px; }
      .billno { font-size:13px; font-weight:bold; }
      .grand  { font-size:14px; font-weight:bold; }
      .footer { font-size:9px; }
      .col-hd { font-weight:bold; border-bottom:1px solid #000; padding-bottom:2px; margin-bottom:3px; }
    </style>
  </head><body>
    <div class="center">
      ${logoHtml}
      <div class="brand">PERSIAN DARBAR</div>
      <div class="tag">&#9654; THE TASTE OF HINDUSTAN &#9664;</div>
      <div style="font-size:9px">Camp, Pune, Maharashtra 411004</div>
      <div style="font-size:9px">Ph: +91 9594287868</div>
      <div style="font-size:9px">GSTIN: 27XXXXX1234X1Z5</div>
    </div>
    <div class="dashed"></div>
    <div class="center bold" style="font-size:12px">BILL / TAX INVOICE</div>
    <div class="dashed"></div>
    <div class="row">
      <span><b>Bill No:</b> <span class="billno">${billNo}</span></span>
      <span>${dateStr}</span>
    </div>
    <div class="row">
      <span><b>Type:</b> ${(order.order_type || "online").replace("_","-").toUpperCase()}</span>
      <span>${timeStr}</span>
    </div>
    <div><b>Customer:</b> ${order.customer_name || "Guest"}</div>
    ${order.phone        ? `<div style="font-size:9px"><b>Phone:</b> ${order.phone}</div>` : ""}
    ${order.address      ? `<div style="font-size:9px"><b>Addr:</b> ${order.address}</div>` : ""}
    ${order.table_number ? `<div><b>Table:</b> ${order.table_number}</div>` : ""}
    <div class="dashed"></div>
    <div class="col-hd row-3">
      <span class="col-name">ITEM</span>
      <span class="col-qty">QTY</span>
      <span class="col-amt">AMT</span>
    </div>
    ${items.map(i => `
      <div class="row-3">
        <span class="col-name">${i.name}${i.variant ? ` (${i.variant})` : ""}</span>
        <span class="col-qty">${i.quantity}</span>
        <span class="col-amt">&#8377;${(i.price * (i.quantity||1)).toFixed(0)}</span>
      </div>
    `).join("")}
    <div class="dashed"></div>
    <div class="row"><span>Subtotal</span><span>&#8377;${subtotal}</span></div>
    ${parseFloat(taxes)   > 0 ? `<div class="row"><span>GST (5%)</span><span>&#8377;${taxes}</span></div>` : ""}
    ${parseFloat(delFee)  > 0 ? `<div class="row"><span>Delivery Fee</span><span>&#8377;${delFee}</span></div>` : ""}
    ${parseFloat(discount)> 0 ? `<div class="row"><span>Discount</span><span>- &#8377;${discount}</span></div>` : ""}
    <div class="solid"></div>
    <div class="row grand"><span>GRAND TOTAL</span><span>&#8377;${total}</span></div>
    <div class="solid"></div>
    ${order.payment_method ? `<div class="center" style="font-size:9px;margin-top:3px">Payment: ${order.payment_method.toUpperCase()}</div>` : ""}
    <div class="center footer" style="margin-top:6px">
      <div>Thank you for your order!</div>
      <div>www.persiandarbar.in</div>
    </div>
  </body></html>`;
}

// ── Main print entry point ────────────────────────────────────────────────────
/**
 * printOrder(order, billNo, mode)
 *
 * mode "auto"   → tries Serial ESC/POS → QZ Tray → window.print()
 * mode "manual" → always window.print() (browser print dialog)
 */
export async function printOrder(order, billNo, mode = "manual") {
  if (mode === "auto") {
    // 1. Web Serial (direct ESC/POS – silent)
    if (_serialPort && _serialPort.writable) {
      const escData = buildEscPosReceipt(order, billNo);
      const ok = await printViaSerial(escData);
      if (ok) return { method: "serial", success: true };
    }

    // 2. QZ Tray
    const qzUp = await checkQzTray();
    if (qzUp) {
      // QZ Tray detected. Full QZ SDK (npm: qz-tray) needed for production.
      // With SDK you'd call: qz.print(qz.configs.create("Printer Name"), data)
      console.info("[PrintService] QZ Tray running – install qz-tray npm pkg for silent printing.");
    }

    // 3. window.print() with auto-focus (Chrome remembers last thermal printer)
    return await _windowPrint(order, billNo, true);
  }

  return await _windowPrint(order, billNo, false);
}

async function _windowPrint(order, billNo, autoFocus) {
  const html = await buildReceiptHtml(order, billNo);
  const w = window.open("", "_blank", "width=340,height=720");
  if (!w) return { method: "popup_blocked", success: false };
  w.document.write(html);
  w.document.close();
  setTimeout(() => {
    w.focus();
    w.print();
    if (autoFocus) setTimeout(() => { try { w.close(); } catch {} }, 4000);
  }, 350);
  return { method: "window.print", success: true };
}

// ── Preference helpers ────────────────────────────────────────────────────────
export const getPrintMode  = ()     => localStorage.getItem("pd_print_mode") || "manual";
export const setPrintMode  = (mode) => localStorage.setItem("pd_print_mode", mode);
