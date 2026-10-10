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
      canvas.width  = img.naturalWidth || 200;
      canvas.height = img.naturalHeight || 200;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      // Convert any colored pixels to crisp, high-density pitch black
      // so thermal and monochrome receipt printers produce a bold, sharp logo
      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 30) {
            data[i] = 0;     // R
            data[i + 1] = 0; // G
            data[i + 2] = 0; // B
            data[i + 3] = 255;
          } else {
            data[i + 3] = 0;
          }
        }
        ctx.putImageData(imgData, 0, 0);
      } catch (e) {
        // Fallback to normal canvas export
      }
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
    ? `<div style="text-align:center;margin-bottom:4px;"><img src="${logoBase64}" alt="Persian Darbar" style="width:85px;height:auto;max-height:55px;object-fit:contain;margin:0 auto;display:inline-block;filter:contrast(200%) brightness(0);" /></div>`
    : "";

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", hour12:true });

  const items    = order.items || [];
  const subtotal = (order.subtotal     || 0).toFixed(2);
  const taxes    = (order.taxes        || 0).toFixed(2);
  const delFee   = (order.delivery_fee || 0).toFixed(2);
  const total    = (order.total        || 0).toFixed(2);
  const discount = (order.discount     || 0).toFixed(2);

  return `<!DOCTYPE html><html><head>
    <title>Bill - ${billNo}</title>
    <style>
      @page { size: 80mm auto; margin: 3mm; }
      * { margin:0; padding:0; box-sizing:border-box; }
      body {
        font-family: 'Courier New', Courier, monospace;
        font-size: 13px;
        font-weight: 700;
        width: 72mm;
        color: #000;
        line-height: 1.35;
      }
      .center { text-align:center; }
      .bold   { font-weight:900; }
      .dashed { border-top:1.5px dashed #000; margin:6px 0; }
      .solid  { border-top:2.5px solid #000; margin:6px 0; }
      .row    { display:flex; justify-content:space-between; font-weight:700; }
      .row-3  { display:flex; font-weight:700; }
      .row-3 .col-name { flex:1; font-weight:800; padding-right:4px; }
      .row-3 .col-qty  { width:32px; text-align:center; font-weight:800; }
      .row-3 .col-amt  { width:58px; text-align:right; font-weight:900; }
      .brand  { font-size:20px; font-weight:900; letter-spacing:1px; margin-top:2px; }
      .sub    { font-size:11px; font-weight:700; }
      .billno { font-size:14px; font-weight:900; }
      .grand  { font-size:17px; font-weight:900; padding:2px 0; }
      .footer { font-size:11px; font-weight:700; }
      .col-hd { font-size:13px; font-weight:900; border-bottom:2px solid #000; padding-bottom:3px; margin-bottom:4px; }
    </style>
  </head><body>
    <div class="center">
      ${logoHtml}
      <div class="brand">PERSIAN DARBAR</div>
      <div class="sub">Camp, Pune, Maharashtra 411004</div>
      <div class="sub">Ph: +91 9594287868</div>
      <div class="sub">GSTIN: 27XXXXX1234X1Z5</div>
    </div>
    <div class="dashed"></div>
    <div class="center bold" style="font-size:14px;letter-spacing:1px;">BILL / TAX INVOICE</div>
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
    ${order.phone        ? `<div class="sub"><b>Phone:</b> ${order.phone}</div>` : ""}
    ${order.address      ? `<div class="sub"><b>Addr:</b> ${order.address}</div>` : ""}
    ${order.table_number ? `<div><b>Table:</b> ${order.table_number}</div>` : ""}
    <div class="dashed"></div>
    <div class="col-hd row-3">
      <span class="col-name">ITEM</span>
      <span class="col-qty">QTY</span>
      <span class="col-amt">AMT</span>
    </div>
    ${items.map(i => `
      <div class="row-3" style="padding:2px 0;">
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
    ${order.payment_method ? `<div class="center bold" style="font-size:12px;margin-top:4px;">Payment: ${order.payment_method.toUpperCase()}</div>` : ""}
    <div class="center footer" style="margin-top:8px;">
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

// ── KOT Printing ─────────────────────────────────────────────────────────────
export async function buildKotHtml(order) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const kotNo = order.kot_number || (order.order_id ? `#${order.order_id.slice(-6).toUpperCase()}` : "KOT-NEW");
  const orderType = (order.order_type || "DINE_IN").replace("_", " ").toUpperCase();
  const tableStr = order.table_number ? `TABLE ${order.table_number}` : orderType;

  const items = order.items || [];
  const totalQty = items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);

  const itemsHtml = items.map((item) => {
    const qty = item.quantity || 1;
    const name = item.name || item.item_name || "Item";
    const variant = item.variant ? `<div class="sub">Variant: ${item.variant}</div>` : "";
    const addons = (item.addons && item.addons.length > 0) ? `<div class="sub">+ ${item.addons.join(", ")}</div>` : "";
    const note = item.special_instructions ? `<div class="note">NOTE: ${item.special_instructions}</div>` : "";

    return `
      <div class="kot-item">
        <div class="item-row">
          <span class="qty">${qty}x</span>
          <span class="name">${name}</span>
        </div>
        ${variant}
        ${addons}
        ${note}
      </div>
    `;
  }).join("");

  const specialRequest = order.special_instructions || order.cooking_instructions || order.delivery_instructions;
  const specialReqHtml = specialRequest ? `
    <div class="solid"></div>
    <div class="bold" style="font-size:11px; color:#000;">SPECIAL INSTRUCTION:</div>
    <div style="font-size:11px; font-weight:bold; margin-top:2px;">${specialRequest}</div>
  ` : "";

  return `<!DOCTYPE html><html><head>
    <title>KOT - ${kotNo}</title>
    <style>
      @page { size: 80mm auto; margin: 3mm; }
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Courier New',Courier,monospace; font-size:12px; width:72mm; color:#000; padding:2mm; }
      .center { text-align:center; }
      .bold   { font-weight:bold; }
      .solid  { border-top:2px solid #000; margin:6px 0; }
      .dashed { border-top:1px dashed #000; margin:5px 0; }
      .double { border-top:3px double #000; margin:6px 0; }
      .brand  { font-size:16px; font-weight:900; letter-spacing:1px; }
      .kot-title { font-size:14px; font-weight:900; margin:3px 0; background:#000; color:#fff; padding:3px 0; }
      .table-banner { font-size:20px; font-weight:900; letter-spacing:1px; margin:4px 0; }
      .meta-row { display:flex; justify-content:space-between; font-size:11px; margin-bottom:2px; }
      .kot-item { padding:4px 0; border-bottom:1px dotted #ccc; }
      .item-row { display:flex; align-items:baseline; }
      .qty { font-size:16px; font-weight:900; width:34px; shrink:0; }
      .name { font-size:13px; font-weight:bold; flex:1; text-transform:uppercase; }
      .sub { font-size:11px; margin-left:34px; color:#333; }
      .note { font-size:11px; font-weight:900; margin-left:34px; margin-top:2px; background:#f0f0f0; padding:2px; border-left:3px solid #000; }
      .total-row { display:flex; justify-content:space-between; font-size:13px; font-weight:bold; margin-top:4px; }
      .footer { font-size:10px; margin-top:6px; }
    </style>
  </head><body>
    <div class="center brand">PERSIAN DARBAR</div>
    <div class="center kot-title">KITCHEN ORDER TICKET (KOT)</div>
    <div class="center table-banner">${tableStr}</div>
    <div class="solid"></div>
    <div class="meta-row">
      <span><b>KOT No:</b> ${kotNo}</span>
      <span>${dateStr}</span>
    </div>
    <div class="meta-row">
      <span><b>Order ID:</b> #${(order.order_id || "").slice(-6).toUpperCase()}</span>
      <span><b>Time:</b> ${timeStr}</span>
    </div>
    <div class="meta-row">
      <span><b>Customer:</b> ${order.customer_name || "Guest"}</span>
      <span><b>Type:</b> ${orderType}</span>
    </div>
    <div class="solid"></div>
    <div class="bold" style="font-size:11px; margin-bottom:4px; text-transform:uppercase;">
      <span>QTY   ITEM DETAILS</span>
    </div>
    <div class="dashed"></div>
    ${itemsHtml}
    ${specialReqHtml}
    <div class="double"></div>
    <div class="total-row">
      <span>TOTAL ITEMS:</span>
      <span>${totalQty}</span>
    </div>
    <div class="dashed"></div>
    <div class="center footer">
      <div>*** KITCHEN COPY — PREPARE FRESH ***</div>
      <div>Order Time: ${timeStr}</div>
    </div>
  </body></html>`;
}

export async function printKOT(order, mode = "manual") {
  const html = await buildKotHtml(order);
  try {
    let iframe = document.getElementById("kot-print-frame");
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "kot-print-frame";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);
    }
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        _popupKotPrint(html, mode);
      }
    }, 250);
    return { method: "iframe.print", success: true };
  } catch (err) {
    return _popupKotPrint(html, mode);
  }
}

function _popupKotPrint(html, mode) {
  const w = window.open("", "_blank", "width=340,height=720");
  if (!w) return { method: "popup_blocked", success: false };
  w.document.write(html);
  w.document.close();
  setTimeout(() => {
    w.focus();
    w.print();
    if (mode === "auto") setTimeout(() => { try { w.close(); } catch {} }, 4000);
  }, 350);
  return { method: "window.print", success: true };
}

// ── Preference helpers ────────────────────────────────────────────────────────
export const getPrintMode  = ()     => localStorage.getItem("pd_print_mode") || "manual";
export const setPrintMode  = (mode) => localStorage.setItem("pd_print_mode", mode);
