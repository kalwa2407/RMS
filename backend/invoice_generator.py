from reportlab.lib.pagesizes import letter, A4
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
    Generate a professional invoice PDF for an order
    
    Args:
        order_data: Dictionary containing order details
        output_path: Path where PDF will be saved
        
    Returns:
        Path to generated PDF
    """
    
    # Create the PDF
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#d97706'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#374151'),
        spaceAfter=12,
        fontName='Helvetica-Bold'
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#4b5563'),
        spaceAfter=6
    )
    
    # Header - Restaurant Name
    header = Paragraph("TASTE OF HINDUSTAN", title_style)
    elements.append(header)
    
    # Restaurant Details
    restaurant_info = Paragraph(
        "Camp, Pune, Maharashtra 411004<br/>Phone: +91 9594287868<br/>GSTIN: 27XXXXX1234X1Z5",
        ParagraphStyle('RestaurantInfo', parent=normal_style, alignment=TA_CENTER, fontSize=9)
    )
    elements.append(restaurant_info)
    elements.append(Spacer(1, 0.3*inch))
    
    # Invoice Title
    invoice_title = Paragraph(
        f"<b>TAX INVOICE</b>",
        ParagraphStyle('InvoiceTitle', parent=heading_style, alignment=TA_CENTER, fontSize=16)
    )
    elements.append(invoice_title)
    elements.append(Spacer(1, 0.2*inch))
    
    # Invoice Details Table
    invoice_details_data = [
        ['Invoice No:', order_data.get('order_id', 'N/A'), 'Date:', datetime.fromisoformat(str(order_data.get('created_at', datetime.now()))).strftime('%d-%m-%Y')],
        ['Order ID:', order_data.get('order_id', 'N/A'), 'Time:', datetime.fromisoformat(str(order_data.get('created_at', datetime.now()))).strftime('%I:%M %p')],
    ]
    
    invoice_details_table = Table(invoice_details_data, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
    invoice_details_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(invoice_details_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # Customer Details
    customer_heading = Paragraph("<b>BILL TO:</b>", heading_style)
    elements.append(customer_heading)
    
    customer_data = [
        ['Name:', order_data.get('customer_name', 'N/A')],
        ['Phone:', order_data.get('phone', 'N/A')],
        ['Address:', order_data.get('address', 'N/A')],
    ]
    if order_data.get('email'):
        customer_data.insert(2, ['Email:', order_data.get('email')])
    
    customer_table = Table(customer_data, colWidths=[1.5*inch, 5*inch])
    customer_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(customer_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Items Table
    items_heading = Paragraph("<b>ORDER DETAILS:</b>", heading_style)
    elements.append(items_heading)
    
    # Table header
    items_data = [['#', 'Item', 'Qty', 'Rate', 'Amount']]
    
    # Add items
    for idx, item in enumerate(order_data.get('items', []), 1):
        item_name = item.get('name', 'N/A')
        
        # Add variant info
        if item.get('variant'):
            item_name += f" ({item.get('variant')})"
        
        # Add addons info
        if item.get('addons') and len(item.get('addons', [])) > 0:
            addon_names = [addon.get('name', '') for addon in item.get('addons', [])]
            item_name += f"\n  + {', '.join(addon_names)}"
        
        # Add special instructions
        if item.get('special_instructions'):
            item_name += f"\n  Note: {item.get('special_instructions')}"
        
        quantity = item.get('quantity', 1)
        
        # Calculate item price including variant and addons
        item_price = item.get('price', 0.0)
        variant_price = item.get('variant_price', 0.0)
        addon_total = sum([addon.get('price', 0.0) for addon in item.get('addons', [])])
        unit_price = item_price + variant_price + addon_total
        total_price = unit_price * quantity
        
        items_data.append([
            str(idx),
            item_name,
            str(quantity),
            f"₹{unit_price:.2f}",
            f"₹{total_price:.2f}"
        ])
    
    items_table = Table(items_data, colWidths=[0.5*inch, 3.5*inch, 0.8*inch, 1.2*inch, 1.5*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#d97706')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (2, 0), (2, -1), 'CENTER'),
        ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # Totals Table
    subtotal = order_data.get('subtotal', 0.0)
    discount = order_data.get('discount', 0.0)
    delivery_fee = order_data.get('delivery_fee', 0.0)
    taxes = order_data.get('taxes', 0.0)
    total = order_data.get('total', 0.0)
    
    totals_data = [
        ['Subtotal:', f"₹{subtotal:.2f}"],
    ]
    
    if discount > 0:
        totals_data.append(['Discount:', f"- ₹{discount:.2f}"])
        if order_data.get('coupon_code'):
            totals_data.append(['Coupon Applied:', order_data.get('coupon_code')])
    
    if delivery_fee > 0:
        totals_data.append(['Delivery Fee:', f"₹{delivery_fee:.2f}"])
    
    if taxes > 0:
        totals_data.append(['Taxes (GST):', f"₹{taxes:.2f}"])
    
    totals_data.append(['<b>GRAND TOTAL:</b>', f"<b>₹{total:.2f}</b>"])
    
    # Convert to paragraphs for bold text
    totals_data_formatted = []
    for row in totals_data:
        totals_data_formatted.append([
            Paragraph(row[0], normal_style),
            Paragraph(row[1], ParagraphStyle('RightAlign', parent=normal_style, alignment=TA_RIGHT))
        ])
    
    totals_table = Table(totals_data_formatted, colWidths=[5*inch, 2*inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
        ('LINEABOVE', (0, -1), (-1, -1), 2, colors.HexColor('#d97706')),
        ('TOPPADDING', (0, 0), (-1, -2), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -2), 6),
        ('TOPPADDING', (0, -1), (-1, -1), 12),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 12),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Payment Details
    payment_info = Paragraph(
        f"<b>Payment Method:</b> {order_data.get('payment_method', 'N/A').upper()}<br/>"
        f"<b>Payment Status:</b> {order_data.get('payment_status', 'Pending').upper()}",
        normal_style
    )
    elements.append(payment_info)
    elements.append(Spacer(1, 0.3*inch))
    
    # Footer
    footer = Paragraph(
        "Thank you for your order!<br/>For any queries, contact us at +91 9594287868",
        ParagraphStyle('Footer', parent=normal_style, alignment=TA_CENTER, fontSize=9, textColor=colors.HexColor('#6b7280'))
    )
    elements.append(footer)
    
    # Build PDF
    doc.build(elements)
    
    return output_path
