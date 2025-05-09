/**
 * Auric Firebase Orders Management System
 * 
 * This module handles all order-related operations with Firebase Firestore,
 * including saving orders, retrieving order history, and tracking order status.
 * 
 * All orders are stored at path: users/{userId}/orders/{orderId}
 * This follows the same pattern as the cart data and ensures orders are associated with user accounts.
 */

// Access Firebase instances that should be already initialized in the HTML
const db = firebase.firestore();
const auth = firebase.auth();

// Collection names
const USERS_COLLECTION = 'users';
const ORDERS_COLLECTION = 'orders';

/**
 * Check if a user is currently authenticated
 * @returns {Boolean} True if user is logged in, false otherwise
 */
function isUserAuthenticated() {
    return !!auth.currentUser;
}

/**
 * Save an order to Firebase Firestore
 * @param {Object} orderData - Complete order data including customer info and products
 * @returns {Promise<Object>} - Order reference ID and success status
 */
export async function saveOrderToFirebase(orderData) {
    try {
        // Check if user is authenticated
        if (!isUserAuthenticated()) {
            console.log('User not logged in, order cannot be saved to Firebase');
            return { 
                success: false, 
                requiresAuth: true, 
                error: 'Authentication required to save order' 
            };
        }

        const userId = auth.currentUser.uid;
        
        // Create a new order with timestamp and status
        const orderWithMetadata = {
            ...orderData,
            userId: userId,
            createdAt: firebase.firestore.Timestamp.now(),
            status: 'pending',
            updatedAt: firebase.firestore.Timestamp.now()
        };
        
        // Create order document in the path: users/{userId}/orders/{auto-id}
        const orderRef = db.collection(USERS_COLLECTION)
                           .doc(userId)
                           .collection(ORDERS_COLLECTION)
                           .doc(); // Auto-generated ID

        // Get the auto-generated ID
        const orderId = orderRef.id;
        
        // Update the order reference in the order data
        orderWithMetadata.orderId = orderId;
        
        console.log('Saving order to Firebase path:', `${USERS_COLLECTION}/${userId}/${ORDERS_COLLECTION}/${orderId}`);
        
        // Save the order data
        await orderRef.set(orderWithMetadata);
        
        console.log('Order saved to Firebase with ID:', orderId);
        return { 
            success: true, 
            orderId: orderId 
        };
    } catch (error) {
        console.error('Error saving order to Firebase:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
}

/**
 * Get all orders for the current user
 * @returns {Promise<Object>} - List of orders and success status
 */
export async function getUserOrders() {
    try {
        // Check if user is authenticated
        if (!isUserAuthenticated()) {
            console.log('User not logged in, no orders to retrieve');
            return { 
                success: false, 
                requiresAuth: true, 
                orders: [], 
                error: 'Authentication required to view orders' 
            };
        }

        const userId = auth.currentUser.uid;
        
        // Get orders from the path: users/{userId}/orders
        const ordersRef = db.collection(USERS_COLLECTION)
                            .doc(userId)
                            .collection(ORDERS_COLLECTION)
                            .orderBy('createdAt', 'desc');
        
        console.log('Retrieving orders from Firebase path:', `${USERS_COLLECTION}/${userId}/${ORDERS_COLLECTION}`);
        const ordersSnapshot = await ordersRef.get();
        
        // Convert to array of order objects
        const orders = [];
        ordersSnapshot.forEach(doc => {
            orders.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`Retrieved ${orders.length} orders from Firebase`);
        return { 
            success: true, 
            orders: orders 
        };
    } catch (error) {
        console.error('Error retrieving orders from Firebase:', error);
        return { 
            success: false, 
            orders: [], 
            error: error.message 
        };
    }
}

/**
 * Get a specific order by ID for the current user
 * @param {String} orderId - ID of the order to retrieve
 * @returns {Promise<Object>} - Order data and success status
 */
export async function getOrderById(orderId) {
    try {
        // Check if user is authenticated
        if (!isUserAuthenticated()) {
            console.log('User not logged in, no order to retrieve');
            return { 
                success: false, 
                requiresAuth: true, 
                error: 'Authentication required to view order' 
            };
        }

        const userId = auth.currentUser.uid;
        
        // Get order from the path: users/{userId}/orders/{orderId}
        const orderRef = db.collection(USERS_COLLECTION)
                           .doc(userId)
                           .collection(ORDERS_COLLECTION)
                           .doc(orderId);
        
        console.log('Retrieving order from Firebase path:', `${USERS_COLLECTION}/${userId}/${ORDERS_COLLECTION}/${orderId}`);
        const orderDoc = await orderRef.get();
        
        if (!orderDoc.exists) {
            console.log('Order not found:', orderId);
            return { 
                success: false, 
                error: 'Order not found' 
            };
        }
        
        const orderData = {
            id: orderDoc.id,
            ...orderDoc.data()
        };
        
        console.log('Order retrieved from Firebase:', orderData.orderId);
        return { 
            success: true, 
            order: orderData 
        };
    } catch (error) {
        console.error('Error retrieving order from Firebase:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
}

/**
 * Check if the order requires authentication
 * @returns {Boolean} True if authentication is required for orders
 */
export function requiresAuthentication() {
    return true; // We always require authentication for orders
}

/**
 * Handle authentication requirement for orders
 * Determines if the login modal should be shown
 * @returns {Object} Status and message about authentication requirement
 */
export function checkOrderAuthRequirement() {
    if (isUserAuthenticated()) {
        return { 
            requiresAuth: false, 
            isAuthenticated: true 
        };
    } else {
        return { 
            requiresAuth: true, 
            isAuthenticated: false,
            message: 'Please create an account or sign in to place your order'
        };
    }
}