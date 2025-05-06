# Architecture

## Overview

Auric is an e-commerce web application for selling jewelry. It follows a simple architecture with a static HTML/CSS frontend that uses JavaScript for client-side interactions and a minimal Node.js backend providing basic server capabilities. The application integrates with Firebase for authentication and potentially other services, and has Razorpay integration for payment processing.

## System Architecture

### Frontend Architecture

Auric uses a traditional multi-page web application architecture with HTML, CSS, and JavaScript:

- Static HTML pages for different sections (home, product details, cart, checkout, etc.)
- CSS for styling, with separate files for responsive design and specific components
- JavaScript for client-side interactivity and state management
- Client-side rendering with no frontend framework

### Backend Architecture

The application has two server options:

1. **Node.js Server (server.js)**:
   - Simple HTTP server that serves static files
   - Handles Razorpay API integration for payment processing
   - Provides no-cache headers for development

2. **Python Server (server.py)**:
   - Alternative simple HTTP server using Python's built-in server
   - Configures no-cache headers for development purposes

### Data Management

The application uses a combination of:

- **Client-side Storage**: LocalStorage for anonymous carts and temporary data
- **Firebase Firestore**: For authenticated user data, including user profiles and carts
- **There is reference to Drizzle ORM** (`server/db.ts`), suggesting a possible database connection, but the implementation is incomplete

## Key Components

### User Interface Components

1. **Navigation System**:
   - Responsive navbar with mobile-friendly design
   - Dropdown menus for product categories
   - Mobile sidebar menu

2. **Product Display**:
   - Product grids on main pages
   - Detailed product view with gallery
   - Thumbnail navigation for product images

3. **Shopping Cart**:
   - Sliding cart panel
   - Cart management (add, remove, update quantities)
   - Cart synchronization between local storage and Firebase

4. **Checkout Flow**:
   - Multi-step checkout process
   - Address and shipping information collection
   - Integration with Razorpay payment gateway
   - Order confirmation and success pages

5. **User Authentication**:
   - Login and signup forms
   - Firebase Authentication integration
   - User profile management

### Functional Modules

1. **Authentication Module** (`js/direct-auth.js`):
   - Firebase Authentication integration
   - Email/password and Google authentication methods
   - User session management

2. **Cart Management** (`js/cart.js`, `js/cart-panel.js`):
   - Cart data structure and operations
   - LocalStorage for anonymous users
   - Firebase Firestore for authenticated users
   - Sliding cart panel UI

3. **Checkout System** (`js/checkout.js`):
   - Form validation and state management
   - Shipping and billing information collection
   - Integration with Razorpay payment gateway
   - Order processing and confirmation emails via EmailJS

4. **Product Gallery** (`js/product-gallery.js`):
   - Image gallery navigation
   - Thumbnail preview functionality

5. **UI Components**:
   - Banner rotator (`js/banner-rotator.js`)
   - Auto slider (`js/auto-slider.js`)
   - Mobile menu handling (`js/mobile-menu.js`, `js/navigation.js`)

## Data Flow

1. **Anonymous User Flow**:
   - Products browsed directly
   - Cart data stored in localStorage
   - Checkout requires login/signup

2. **Authenticated User Flow**:
   - User logs in via Firebase Authentication
   - Cart data synced from localStorage to Firestore
   - User profile and order history accessible
   - Checkout process enabled with saved user data

3. **Checkout and Payment Flow**:
   - User enters shipping and billing information
   - Order summary created and validated
   - Razorpay payment gateway integration for payment processing
   - Order confirmation emails sent via EmailJS
   - Order details stored in Firestore (for authenticated users)

## External Dependencies

1. **Firebase**:
   - Authentication (Email/Password and Google OAuth)
   - Firestore database for user data and orders
   - Project configuration in environment variables

2. **Razorpay**:
   - Payment gateway integration in checkout process
   - API keys defined in server.js

3. **EmailJS**:
   - Email service for order confirmations
   - Templates defined in email-templates.md

4. **Font Awesome**:
   - Icon library for UI elements

5. **Google Fonts**:
   - Typography using Playfair Display and Lato font families

## Deployment Strategy

The repository includes configuration for deployment in a Replit environment:

1. **Development Environment**:
   - Replit configuration in `.replit` and `replit.nix`
   - Node.js and Python runtimes
   - Development HTTP server with no-cache headers

2. **Production Deployment**:
   - No explicit production deployment configuration
   - Likely intended for simple hosting platforms
   - Firebase API keys suggest Firebase Hosting is a possibility

3. **Server Configuration**:
   - HTTP server running on port 5000
   - External port mapping to port 80

## Future Architecture Considerations

1. **Database Integration**:
   - Complete implementation of Drizzle ORM with a database backend
   - Possibly move to a more robust database solution for product and order data

2. **API Development**:
   - Develop a more comprehensive API for product and order management
   - Implement additional backend services for inventory management

3. **Authentication Enhancement**:
   - Further develop user roles and permissions
   - Implement additional security measures for authentication

4. **Scalability**:
   - Implement caching strategies for product data
   - Optimize image loading and storage
   - Consider CDN integration for static assets