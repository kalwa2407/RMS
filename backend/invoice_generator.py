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
    Generate a professional invoice PDF for an order with Persian Darbar branding,
    monthly sequential bill number, and clean ASCII currency formatting (Rs.).
    
    Args:
        order_data: Dictionary containing order details
        output_path: Path where PDF will be saved
        
    Returns:
        Path to generated PDF
    """
    # Ensure parent directory exists
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    
    # Create the PDF
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=0.5 * inch,
        rightMargin=0.5 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch
    )
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=22,
        textColor=colors.HexColor('#d97706'),
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=13,
        textColor=colors.HexColor('#1f2937'),
        spaceAfter=8,
        fontName='Helvetica-Bold'
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#4b5563'),
        spaceAfter=4
    )
    
    bold_style = ParagraphStyle(
        'CustomBold',
        parent=normal_style,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#111827')
    )
    
    # ── 1. Brand Logo ──
    logo_candidates = [
        Path(__file__).parent / "static" / "logo.png",
        Path(__file__).parent.parent / "frontend" / "public" / "persian_darbar_logo_1776079280186.png",
        Path(__file__).parent.parent / "frontend" / "public" / "logo.png",
    ]
    for candidate in logo_candidates:
        if candidate.exists():
            try:
                logo_img = Image(str(candidate), width=1.4 * inch, height=0.65 * inch)
                logo_img.hAlign = 'CENTER'
                elements.append(logo_img)
                elements.append(Spacer(1, 0.08 * inch))
                break
            except Exception:
                pass
    
    # ── 2. Header - Restaurant Name & Address ──
    header = Paragraph("PERSIAN DARBAR", title_style)
    elements.append(header)
    
    restaurant_info = Paragraph(
        "Wellesley Rd, Camp, Pune, Maharashtra 411001<br/>"
        "Phone: +91 9594287868 | Email: contact@persiandarbar.in<br/>"
        "GSTIN: 27XXXXX1234X1Z5 | FSSAI Lic No: 11522036000123",
        ParagraphStyle('RestaurantInfo', parent=normal_style, alignment=TA_CENTER, fontSize=8.5, textColor=colors.HexColor('#6b7280'))
    )
    elements.append(restaurant_info)
    elements.append(Spacer(1, 0.2 * inch))
    
    # ── 3. Invoice Title Banner ──
    invoice_title = Paragraph(
        "<b>TAX INVOICE / CASH MEMO</b>",
        ParagraphStyle('InvoiceTitle', parent=heading_style, alignment=TA_CENTER, fontSize=14, textColor=colors.HexColor('#b45309'))
    )
    elements.append(invoice_title)
    elements.append(Spacer(1, 0.15 * inch))
    
    # ── 4. Invoice & Order Details Table ──
    bill_no = order_data.get('bill_number') or order_data.get('invoice_no') or order_data.get('order_id', 'N/A')
    
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
    
    invoice_details_data = [
        ['Bill No:', str(bill_no), 'Date:', date_str],
        ['Order ID:', str(order_data.get('order_id', 'N/A')), 'Time:', time_str],
        ['Order Type:', str(order_data.get('order_type', 'DELIVERY')).upper(), 'Table / Ref:', str(order_data.get('table_number') or order_data.get('kot_number') or 'Direct')]
    ]
    
    invoice_details_table = Table(invoice_details_data, colWidths=[1.3 * inch, 2.3 * inch, 1.3 * inch, 2.3 * inch])
    invoice_details_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1f2937')),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fef3c7')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#f59e0b')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#fde68a')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(invoice_details_table)
    elements.append(Spacer(1, 0.18 * inch))
    
    # ── 5. Customer Details ──
    customer_heading = Paragraph("<b>BILL TO:</b>", heading_style)
    elements.append(customer_heading)
    
    customer_data = [
        ['Customer Name:', str(order_data.get('customer_name', 'Walk-in Guest'))],
        ['Phone Number:', str(order_data.get('phone', 'N/A'))],
        ['Delivery Address:', str(order_data.get('address', 'N/A'))],
    ]
    if order_data.get('email'):
        customer_data.insert(2, ['Email Address:', str(order_data.get('email'))])
    
    customer_table = Table(customer_data, colWidths=[1.5 * inch, 5.7 * inch])
    customer_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(customer_table)
    elements.append(Spacer(1, 0.18 * inch))
    
    # ── 6. Items Table ──
    items_heading = Paragraph("<b>ORDER ITEMIZATION:</b>", heading_style)
    elements.append(items_heading)
    
    items_data = [['#', 'Item Description', 'Qty', 'Rate (Rs.)', 'Amount (Rs.)']]
    
    for idx, item in enumerate(order_data.get('items', []), 1):
        item_name = str(item.get('name', 'Item'))
        if item.get('variant'):
            item_name += f" ({item.get('variant')})"
        if item.get('addons') and len(item.get('addons', [])) > 0:
            addon_names = [addon.get('name', '') for addon in item.get('addons', [])]
            item_name += f"<br/>&nbsp;&nbsp;+ {', '.join(addon_names)}"
        if item.get('special_instructions'):
            item_name += f"<br/>&nbsp;&nbsp;<i>Note: {item.get('special_instructions')}</i>"
            
        quantity = item.get('quantity', 1)
        item_price = float(item.get('price', 0.0) or 0.0)
        variant_price = float(item.get('variant_price', 0.0) or 0.0)
        addon_total = sum([float(addon.get('price', 0.0) or 0.0) for addon in item.get('addons', [])])
        unit_price = item_price + variant_price + addon_total
        total_price = unit_price * quantity
        
        item_desc_paragraph = Paragraph(item_name, normal_style)
        
        items_data.append([
            str(idx),
            item_desc_paragraph,
            str(quantity),
            f"Rs. {unit_price:.2f}",
            f"Rs. {total_price:.2f}"
        ])
    
    items_table = Table(items_data, colWidths=[0.4 * inch, 3.8 * inch, 0.7 * inch, 1.1 * inch, 1.2 * inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#d97706')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (2, 0), (2, -1), 'CENTER'),
        ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9.5),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fffbeb')]),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 0.15 * inch))
    
    # ── 7. Totals Table ──
    subtotal = float(order_data.get('subtotal', 0.0) or 0.0)
    discount = float(order_data.get('discount', 0.0) or 0.0)
    delivery_fee = float(order_data.get('delivery_fee', 0.0) or 0.0)
    taxes = float(order_data.get('taxes', 0.0) or 0.0)
    total = float(order_data.get('total', 0.0) or 0.0)
    
    # Auto-detect missing delivery fee in arithmetic (total - subtotal + discount - taxes)
    expected_diff = round(total - (subtotal - discount + taxes), 2)
    if delivery_fee <= 0 and expected_diff > 0:
        delivery_fee = expected_diff
    
    totals_data = [
        ['Subtotal:', f"Rs. {subtotal:.2f}"],
    ]
    
    if discount > 0:
        totals_data.append(['Discount:', f"- Rs. {discount:.2f}"])
        if order_data.get('coupon_code'):
            totals_data.append(['Coupon Applied:', str(order_data.get('coupon_code'))])
    
    if delivery_fee > 0:
        totals_data.append(['Delivery Charges:', f"Rs. {delivery_fee:.2f}"])
    
    if taxes > 0:
        totals_data.append(['Taxes (GST 5%):', f"Rs. {taxes:.2f}"])
    
    totals_data.append(['<b>GRAND TOTAL:</b>', f"<b>Rs. {total:.2f}</b>"])
    
    totals_data_formatted = []
    for row in totals_data:
        totals_data_formatted.append([
            Paragraph(row[0], bold_style if 'GRAND TOTAL' in row[0] else normal_style),
            Paragraph(row[1], ParagraphStyle('RightAlign', parent=bold_style if 'GRAND TOTAL' in row[0] else normal_style, alignment=TA_RIGHT))
        ])
    
    totals_table = Table(totals_data_formatted, colWidths=[5.0 * inch, 2.2 * inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 0), (-1, -1), 9.5),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1f2937')),
        ('LINEABOVE', (0, -1), (-1, -1), 1.5, colors.HexColor('#d97706')),
        ('TOPPADDING', (0, 0), (-1, -2), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -2), 4),
        ('TOPPADDING', (0, -1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 8),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 0.2 * inch))
    
    # ── 8. Payment Details ──
    pm = str(order_data.get('payment_method', 'N/A')).upper()
    ps = str(order_data.get('payment_status', 'PENDING')).upper()
    
    payment_info = Paragraph(
        f"<b>Payment Method:</b> {pm}&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;"
        f"<b>Payment Status:</b> <font color=\"{'#15803d' if ps == 'PAID' else '#b45309'}\"><b>{ps}</b></font>",
        normal_style
    )
    elements.append(payment_info)
    elements.append(Spacer(1, 0.25 * inch))
    
    # ── 9. Footer ──
    footer = Paragraph(
        "Thank you for dining with Persian Darbar!<br/>"
        "For any queries, complaints, or feedback, call us at <b>+91 9594287868</b>.<br/>"
        "<i>This is a computer-generated tax invoice.</i>",
        ParagraphStyle('Footer', parent=normal_style, alignment=TA_CENTER, fontSize=8.5, textColor=colors.HexColor('#6b7280'))
    )
    elements.append(footer)
    
    # Build PDF
    doc.build(elements)
    return output_path
