from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from datetime import datetime
from pathlib import Path
import os

def generate_invoice_pdf(order_data: dict, output_path: str) -> str:
    """
    Generate an ultra-clear, highly readable, bold tax invoice PDF for Persian Darbar.
    Features:
    - Official Persian Darbar royal brand logo placed prominently at the TOP.
    - Large, high-visibility, 100% bold typography (Helvetica-Bold across all elements).
    - Strictly Persian Darbar branding (zero trace of legacy names).
    - Monthly sequential bill number (#OCT010, etc.) and itemized order breakdown.
    - Clean ASCII currency formatting (Rs.).
    """
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=0.45 * inch,
        rightMargin=0.45 * inch,
        topMargin=0.35 * inch,
        bottomMargin=0.35 * inch
    )
    elements = []
    styles = getSampleStyleSheet()
    
    # ── High-visibility BOLD typography styles ──
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=26,
        textColor=colors.HexColor('#111827'),
        spaceAfter=4,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    rest_info_style = ParagraphStyle(
        'RestaurantInfo',
        parent=styles['Normal'],
        fontSize=10.5,
        textColor=colors.HexColor('#1f2937'),
        alignment=TA_CENTER,
        leading=15,
        fontName='Helvetica-Bold'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#111827'),
        spaceAfter=6,
        fontName='Helvetica-Bold'
    )
    
    cell_bold_11 = ParagraphStyle(
        'CellBold11',
        parent=styles['Normal'],
        fontSize=11.5,
        textColor=colors.HexColor('#111827'),
        leading=15,
        fontName='Helvetica-Bold'
    )
    
    cell_bold_11_right = ParagraphStyle(
        'CellBold11Right',
        parent=cell_bold_11,
        alignment=TA_RIGHT
    )
    
    cell_bold_11_center = ParagraphStyle(
        'CellBold11Center',
        parent=cell_bold_11,
        alignment=TA_CENTER
    )

    # ── 1. Top Persian Darbar Logo ──
    logo_candidates = [
        Path(__file__).parent / "static" / "logo-nav-gold.png",
        Path(__file__).parent / "static" / "logo-nav.png",
        Path(__file__).parent / "static" / "logo.png",
        Path(__file__).parent.parent / "frontend" / "public" / "logo-nav.png",
    ]
    for candidate in logo_candidates:
        if candidate.exists():
            try:
                logo_img = Image(str(candidate), width=2.6 * inch, height=1.3 * inch)
                logo_img.hAlign = 'CENTER'
                elements.append(logo_img)
                elements.append(Spacer(1, 0.05 * inch))
                break
            except Exception:
                pass

    # ── 2. Header - Restaurant Name & Official Details ──
    elements.append(Paragraph("PERSIAN DARBAR", title_style))
    elements.append(Paragraph(
        "Wellesley Rd, Camp, Pune, Maharashtra 411001<br/>"
        "Phone: +91 95942 87868 | Email: contact@persiandarbar.in<br/>"
        "GSTIN: 27XXXXX1234X1Z5 | FSSAI Lic No: 11522036000123",
        rest_info_style
    ))
    elements.append(Spacer(1, 0.15 * inch))
    
    # ── 3. Invoice Title Banner ──
    elements.append(Paragraph(
        "<b>TAX INVOICE / CASH MEMO</b>",
        ParagraphStyle('Banner', parent=heading_style, alignment=TA_CENTER, fontSize=15, textColor=colors.HexColor('#92400e'))
    ))
    elements.append(Spacer(1, 0.12 * inch))
    
    # ── 4. Invoice & Order Details Table ──
    bill_no = order_data.get('bill_number') or order_data.get('invoice_no') or order_data.get('order_id', 'N/A')
    order_id = str(order_data.get('order_id', 'N/A'))
    
    created_at_raw = order_data.get('created_at') or datetime.now()
    try:
        if isinstance(created_at_raw, str):
            dt = datetime.fromisoformat(created_at_raw.replace("Z", "+00:00"))
        elif isinstance(created_at_raw, datetime):
            dt = created_at_raw
        else:
            dt = datetime.now()
    except Exception:
        dt = datetime.now()
        
    date_str = dt.strftime('%d-%m-%Y')
    time_str = dt.strftime('%I:%M %p')
    order_type_str = str(order_data.get('order_type', 'DELIVERY')).upper()
    pay_status = str(order_data.get('payment_status', 'PAID')).upper()
    pay_method = str(order_data.get('payment_method', 'ONLINE')).upper()
    
    status_color = "#15803d" if pay_status in ["PAID", "COMPLETED", "SUCCESS"] else "#b45309"
    pay_display = f'<font color="{status_color}"><b>{pay_status} ({pay_method})</b></font>'
    
    details_data = [
        [
            Paragraph('<b>Bill / Invoice No:</b>', cell_bold_11),
            Paragraph(f'<b>#{bill_no}</b>', cell_bold_11),
            Paragraph('<b>Date:</b>', cell_bold_11),
            Paragraph(f'<b>{date_str}</b>', cell_bold_11)
        ],
        [
            Paragraph('<b>Order ID:</b>', cell_bold_11),
            Paragraph(f'<b>#{order_id[-6:].upper() if len(order_id) >= 6 else order_id}</b>', cell_bold_11),
            Paragraph('<b>Time:</b>', cell_bold_11),
            Paragraph(f'<b>{time_str}</b>', cell_bold_11)
        ],
        [
            Paragraph('<b>Order Type:</b>', cell_bold_11),
            Paragraph(f'<b>{order_type_str}</b>', cell_bold_11),
            Paragraph('<b>Payment Status:</b>', cell_bold_11),
            Paragraph(pay_display, cell_bold_11)
        ]
    ]
    t_details = Table(details_data, colWidths=[1.6 * inch, 2.2 * inch, 1.5 * inch, 2.1 * inch])
    t_details.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fef3c7')),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor('#d97706')),
        ('INNERGRID', (0, 0), (-1, -1), 0.8, colors.HexColor('#fde68a')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t_details)
    elements.append(Spacer(1, 0.18 * inch))
    
    # ── 5. Customer Details ──
    elements.append(Paragraph('<b>BILL TO (CUSTOMER DETAILS):</b>', heading_style))
    cust_data = [
        [Paragraph('<b>Customer Name:</b>', cell_bold_11), Paragraph(f'<b>{order_data.get("customer_name", "Walk-in Guest")}</b>', cell_bold_11)],
        [Paragraph('<b>Contact Phone:</b>', cell_bold_11), Paragraph(f'<b>{order_data.get("phone", "N/A")}</b>', cell_bold_11)],
        [Paragraph('<b>Delivery Address:</b>', cell_bold_11), Paragraph(f'<b>{order_data.get("address", "N/A")}</b>', cell_bold_11)],
    ]
    if order_data.get('email'):
        cust_data.insert(2, [Paragraph('<b>Email Address:</b>', cell_bold_11), Paragraph(f'<b>{order_data.get("email")}</b>', cell_bold_11)])
        
    t_cust = Table(cust_data, colWidths=[1.7 * inch, 5.7 * inch])
    t_cust.setStyle(TableStyle([
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(t_cust)
    elements.append(Spacer(1, 0.18 * inch))
    
    # ── 6. Items Table ──
    elements.append(Paragraph('<b>ORDER ITEMIZATION:</b>', heading_style))
    items_header = [
        Paragraph('<b>#</b>', ParagraphStyle('H0', parent=cell_bold_11, fontSize=12, textColor=colors.whitesmoke)),
        Paragraph('<b>Item Description</b>', ParagraphStyle('H1', parent=cell_bold_11, fontSize=12, textColor=colors.whitesmoke)),
        Paragraph('<b>Qty</b>', ParagraphStyle('H2', parent=cell_bold_11_center, fontSize=12, textColor=colors.whitesmoke)),
        Paragraph('<b>Rate (Rs.)</b>', ParagraphStyle('H3', parent=cell_bold_11_right, fontSize=12, textColor=colors.whitesmoke)),
        Paragraph('<b>Amount (Rs.)</b>', ParagraphStyle('H4', parent=cell_bold_11_right, fontSize=12, textColor=colors.whitesmoke)),
    ]
    items_rows = [items_header]
    
    for idx, item in enumerate(order_data.get('items', []), 1):
        item_name = str(item.get('name') or item.get('item_name') or 'Item')
        if item.get('variant'):
            item_name += f" ({item.get('variant')})"
        if item.get('addons') and len(item.get('addons', [])) > 0:
            addon_names = [addon.get('name', '') for addon in item.get('addons', []) if addon.get('name')]
            if addon_names:
                item_name += f"<br/>&nbsp;&nbsp;+ {', '.join(addon_names)}"
        if item.get('special_instructions'):
            item_name += f"<br/>&nbsp;&nbsp;Note: {item.get('special_instructions')}"
            
        quantity = int(item.get('quantity', 1) or 1)
        item_price = float(item.get('price', 0.0) or 0.0)
        variant_price = float(item.get('variant_price', 0.0) or 0.0)
        addon_total = sum([float(addon.get('price', 0.0) or 0.0) for addon in item.get('addons', [])])
        unit_price = item_price + variant_price + addon_total
        total_price = unit_price * quantity
        
        items_rows.append([
            Paragraph(f'<b>{idx}</b>', cell_bold_11),
            Paragraph(f'<b>{item_name}</b>', cell_bold_11),
            Paragraph(f'<b>{quantity}</b>', cell_bold_11_center),
            Paragraph(f'<b>Rs. {unit_price:.2f}</b>', cell_bold_11_right),
            Paragraph(f'<b>Rs. {total_price:.2f}</b>', cell_bold_11_right),
        ])
    
    t_items = Table(items_rows, colWidths=[0.5 * inch, 3.7 * inch, 0.7 * inch, 1.2 * inch, 1.3 * inch])
    t_items.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#d97706')),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 7),
        ('GRID', (0, 0), (-1, -1), 0.8, colors.HexColor('#d1d5db')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fffbeb')]),
    ]))
    elements.append(t_items)
    elements.append(Spacer(1, 0.15 * inch))
    
    # ── 7. Totals Table ──
    subtotal = float(order_data.get('subtotal', 0.0) or 0.0)
    discount = float(order_data.get('discount', 0.0) or 0.0)
    delivery_fee = float(order_data.get('delivery_fee', 0.0) or 0.0)
    taxes = float(order_data.get('taxes') or order_data.get('tax') or 0.0)
    total = float(order_data.get('total', 0.0) or 0.0)
    
    # Auto-adjust delivery fee discrepancy if necessary
    expected_diff = round(total - (subtotal - discount + taxes), 2)
    if delivery_fee <= 0 and expected_diff > 0:
        delivery_fee = expected_diff
    
    totals_data = [
        [Paragraph('<b>Subtotal:</b>', cell_bold_11_right), Paragraph(f'<b>Rs. {subtotal:.2f}</b>', cell_bold_11_right)],
    ]
    if discount > 0:
        totals_data.append([Paragraph('<b>Discount:</b>', cell_bold_11_right), Paragraph(f'<b>- Rs. {discount:.2f}</b>', cell_bold_11_right)])
        if order_data.get('coupon_code'):
            totals_data.append([Paragraph('<b>Coupon Applied:</b>', cell_bold_11_right), Paragraph(f'<b>{order_data.get("coupon_code")}</b>', cell_bold_11_right)])
    if delivery_fee > 0:
        totals_data.append([Paragraph('<b>Delivery Charges:</b>', cell_bold_11_right), Paragraph(f'<b>Rs. {delivery_fee:.2f}</b>', cell_bold_11_right)])
    if taxes > 0:
        totals_data.append([Paragraph('<b>Taxes (GST 5%):</b>', cell_bold_11_right), Paragraph(f'<b>Rs. {taxes:.2f}</b>', cell_bold_11_right)])
        
    totals_data.append([
        Paragraph('<b>GRAND TOTAL:</b>', ParagraphStyle('GT', parent=cell_bold_11_right, fontSize=15, textColor=colors.HexColor('#92400e'))),
        Paragraph(f'<b>Rs. {total:.2f}</b>', ParagraphStyle('GTAmt', parent=cell_bold_11_right, fontSize=15, textColor=colors.HexColor('#92400e')))
    ])
    
    t_tot = Table(totals_data, colWidths=[5.4 * inch, 2.0 * inch])
    t_tot.setStyle(TableStyle([
        ('LINEABOVE', (0, -1), (-1, -1), 2, colors.HexColor('#d97706')),
        ('TOPPADDING', (0, 0), (-1, -2), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -2), 5),
        ('TOPPADDING', (0, -1), (-1, -1), 9),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 9),
    ]))
    elements.append(t_tot)
    elements.append(Spacer(1, 0.25 * inch))
    
    # ── 8. Footer ──
    elements.append(Paragraph(
        "<b>Thank you for dining with Persian Darbar!</b><br/>"
        "<b>For any queries, complaints, or feedback, call us at +91 95942 87868.</b><br/>"
        "<b>This is a computer-generated tax invoice.</b>",
        ParagraphStyle('Footer', parent=rest_info_style, fontSize=10.5, textColor=colors.HexColor('#374151'))
    ))
    
    doc.build(elements)
    return output_path
