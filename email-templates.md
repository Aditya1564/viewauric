# Auric Jewelry - Email Templates for EmailJS

These templates are designed to be used with EmailJS for sending order confirmation emails to both customers and the store owner. You can copy and paste these templates into your EmailJS dashboard.

## Customer Order Confirmation Template (template_guvarr1)

### Email Subject:
```
Your Auric Jewelry Order Confirmation - {{order_id}}
```

### Email Content (HTML):
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #D4AF37;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 20px;
            background-color: #fff;
        }
        .footer {
            background-color: #f5f5f5;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #777;
        }
        .order-details {
            background-color: #f9f9f9;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .order-details table {
            width: 100%;
            border-collapse: collapse;
        }
        .order-details th, .order-details td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        .order-details th {
            font-weight: bold;
        }
        .total-row {
            font-weight: bold;
        }
        .order-summary {
            margin: 20px 0;
        }
        .shipping-address {
            margin: 20px 0;
        }
        .button {
            display: inline-block;
            background-color: #D4AF37;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin-top: 15px;
        }
        .highlight {
            color: #D4AF37;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Thank You for Your Order!</h1>
        </div>
        <div class="content">
            <p>Dear {{to_name}},</p>
            
            <p>Thank you for your order from Auric Jewelry. We're thrilled that you chose us for your jewelry needs. Your order has been received and is now being processed.</p>
            
            <div class="order-summary">
                <h2>Order Summary</h2>
                <p><strong>Order Number:</strong> {{order_id}}</p>
                <p><strong>Order Date:</strong> {{order_date}}</p>
                <p><strong>Payment Method:</strong> Razorpay ({{payment_id}})</p>
            </div>
            
            <div class="order-details">
                <h3>Order Details</h3>
                <table>
                    <tr>
                        <th>Product</th>
                        <th>Price</th>
                    </tr>
                    <tr>
                        <td colspan="2">{{{items}}}</td>
                    </tr>
                    <tr>
                        <td>Subtotal</td>
                        <td>{{subtotal}}</td>
                    </tr>
                    <tr>
                        <td>Shipping</td>
                        <td>{{shipping}}</td>
                    </tr>
                    <tr class="total-row">
                        <td>Total</td>
                        <td>{{total}}</td>
                    </tr>
                </table>
            </div>
            
            <div class="shipping-address">
                <h3>Shipping Address</h3>
                <p>{{shipping_address}}</p>
            </div>
            
            <p>We'll send you another email when your order ships. If you have any questions or concerns, please don't hesitate to contact our customer service team at <a href="mailto:auric@gmail.com">auric@gmail.com</a> or call us at 090003 95566.</p>
            
            <p>Thank you again for shopping with us!</p>
            
            <p>Warm regards,<br>
            The Auric Jewelry Team</p>
            
            <a href="https://your-website.com/order-tracking" class="button">Track Your Order</a>
        </div>
        <div class="footer">
            <p>&copy; 2025 Auric Jewelry. All rights reserved.</p>
            <p>123 Fashion Street, City, Country</p>
        </div>
    </div>
</body>
</html>
```

## Store Owner Order Notification Template (template_y28nbjk)

### Email Subject:
```
New Order Received - {{order_id}}
```

### Email Content (HTML):
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Order Notification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #333;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 20px;
            background-color: #fff;
        }
        .footer {
            background-color: #f5f5f5;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #777;
        }
        .order-details {
            background-color: #f9f9f9;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .order-details table {
            width: 100%;
            border-collapse: collapse;
        }
        .order-details th, .order-details td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        .order-details th {
            font-weight: bold;
        }
        .total-row {
            font-weight: bold;
            font-size: 18px;
        }
        .customer-details {
            margin: 20px 0;
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 4px;
        }
        .button {
            display: inline-block;
            background-color: #333;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin-top: 15px;
        }
        .highlight {
            color: #D4AF37;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Order Received!</h1>
        </div>
        <div class="content">
            <p>A new order has been placed on your website. Here are the details:</p>
            
            <div class="order-details">
                <h2>Order Information</h2>
                <p><strong>Order Number:</strong> {{order_id}}</p>
                <p><strong>Order Date:</strong> {{order_date}}</p>
                <p><strong>Payment Method:</strong> Razorpay</p>
                <p><strong>Payment ID:</strong> {{payment_id}}</p>
                <p><strong>Total Amount:</strong> <span class="highlight">{{total}}</span></p>
            </div>
            
            <div class="customer-details">
                <h2>Customer Information</h2>
                <p><strong>Name:</strong> {{customer_name}}</p>
                <p><strong>Email:</strong> {{customer_email}}</p>
                <p><strong>Phone:</strong> {{customer_phone}}</p>
                <p><strong>Shipping Address:</strong><br>{{shipping_address}}</p>
            </div>
            
            <div class="order-details">
                <h2>Order Items</h2>
                <table>
                    <tr>
                        <th>Products</th>
                    </tr>
                    <tr>
                        <td>{{{items}}}</td>
                    </tr>
                </table>
            </div>
            
            <p>Please process this order as soon as possible.</p>
            
            <a href="https://your-admin-dashboard.com/orders/{{order_id}}" class="button">View Order in Dashboard</a>
        </div>
        <div class="footer">
            <p>This is an automated email notification from your Auric Jewelry website.</p>
            <p>&copy; 2025 Auric Jewelry</p>
        </div>
    </div>
</body>
</html>
```

## Instructions for Setting Up EmailJS Templates

1. Log in to your EmailJS account (https://dashboard.emailjs.com/sign-in)
2. Go to "Email Templates" in the side navigation
3. Click "Create New Template"
4. Choose "Custom Template"
5. Enter the template information:
   - For the Customer template: Name it "Customer Order Confirmation", copy the subject and HTML content from the Customer Order Confirmation Template above
   - For the Owner template: Name it "Store Owner Order Notification", copy the subject and HTML content from the Store Owner Order Notification Template above
6. Configure template variables by clicking the "Test" button - you'll need to provide sample data for:
   - `to_name`
   - `order_id`
   - `order_date`
   - `payment_id`
   - `items`
   - `subtotal`
   - `shipping`
   - `total`
   - `shipping_address`
   - `customer_name`
   - `customer_email`
   - `customer_phone`
7. Test the template to ensure everything appears correctly
8. Save the templates and make note of their template IDs (they should match the ones provided in your EmailJS credentials)