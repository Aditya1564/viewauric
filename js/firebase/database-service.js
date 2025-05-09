/**
 * Firebase Database Service
 * This module handles all database-related functionality:
 * - User profile creation and management
 * - Order history
 * - Address management
 * - Payment method storage
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  Timestamp,
  arrayUnion,
  arrayRemove,
  deleteDoc
} from "firebase/firestore";

import { db } from "./firebase-config.js";

/**
 * Create a new user profile in Firestore
 * 
 * @param {string} userId - Firebase Auth UID
 * @param {Object} userData - User profile data
 * @returns {Promise<void>}
 */
export const createUserProfile = async (userId, userData) => {
  try {
    const userRef = doc(db, "users", userId);
    
    // Check if user profile already exists
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      console.log("User profile already exists.");
      return { success: true, userExists: true };
    }
    
    // Create initial user profile
    await setDoc(userRef, {
      ...userData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      addresses: [],
      paymentMethods: [],
      orders: []
    });
    
    return { success: true, userId };
  } catch (error) {
    console.error("Error creating user profile:", error);
    return { error: error.message, success: false };
  }
};

/**
 * Get user profile from Firestore
 * 
 * @param {string} userId - Firebase Auth UID
 * @returns {Promise<Object>} - User profile data
 */
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: "User profile not found" };
    }
    
    return { success: true, profile: userDoc.data() };
  } catch (error) {
    console.error("Error retrieving user profile:", error);
    return { error: error.message, success: false };
  }
};

/**
 * Update user profile in Firestore
 * 
 * @param {string} userId - Firebase Auth UID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Success status
 */
export const updateUserProfile = async (userId, updateData) => {
  try {
    const userRef = doc(db, "users", userId);
    
    // Prevent overwriting sensitive fields
    const { uid, email, createdAt, ...safeUpdateData } = updateData;
    
    await updateDoc(userRef, {
      ...safeUpdateData,
      updatedAt: Timestamp.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { error: error.message, success: false };
  }
};

/**
 * Add a new address to user profile
 * 
 * @param {string} userId - Firebase Auth UID
 * @param {Object} address - Address data
 * @returns {Promise<Object>} - Success status
 */
export const addUserAddress = async (userId, address) => {
  try {
    const userRef = doc(db, "users", userId);
    
    // Add a unique ID to the address
    const addressId = Date.now().toString();
    const newAddress = {
      id: addressId,
      ...address,
      createdAt: Timestamp.now()
    };
    
    await updateDoc(userRef, {
      addresses: arrayUnion(newAddress),
      updatedAt: Timestamp.now()
    });
    
    return { success: true, addressId };
  } catch (error) {
    console.error("Error adding user address:", error);
    return { error: error.message, success: false };
  }
};

/**
 * Remove an address from user profile
 * 
 * @param {string} userId - Firebase Auth UID
 * @param {string} addressId - Address ID to remove
 * @returns {Promise<Object>} - Success status
 */
export const removeUserAddress = async (userId, addressId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: "User profile not found" };
    }
    
    const userData = userDoc.data();
    const addressToRemove = userData.addresses.find(addr => addr.id === addressId);
    
    if (!addressToRemove) {
      return { success: false, error: "Address not found" };
    }
    
    await updateDoc(userRef, {
      addresses: arrayRemove(addressToRemove),
      updatedAt: Timestamp.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error removing user address:", error);
    return { error: error.message, success: false };
  }
};

/**
 * Add a new payment method to user profile
 * 
 * @param {string} userId - Firebase Auth UID
 * @param {Object} paymentMethod - Payment method data
 * @returns {Promise<Object>} - Success status
 */
export const addPaymentMethod = async (userId, paymentMethod) => {
  try {
    const userRef = doc(db, "users", userId);
    
    // Add a unique ID to the payment method
    const paymentId = Date.now().toString();
    const newPaymentMethod = {
      id: paymentId,
      ...paymentMethod,
      createdAt: Timestamp.now()
    };
    
    await updateDoc(userRef, {
      paymentMethods: arrayUnion(newPaymentMethod),
      updatedAt: Timestamp.now()
    });
    
    return { success: true, paymentId };
  } catch (error) {
    console.error("Error adding payment method:", error);
    return { error: error.message, success: false };
  }
};

/**
 * Remove a payment method from user profile
 * 
 * @param {string} userId - Firebase Auth UID
 * @param {string} paymentId - Payment method ID to remove
 * @returns {Promise<Object>} - Success status
 */
export const removePaymentMethod = async (userId, paymentId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: "User profile not found" };
    }
    
    const userData = userDoc.data();
    const paymentToRemove = userData.paymentMethods.find(payment => payment.id === paymentId);
    
    if (!paymentToRemove) {
      return { success: false, error: "Payment method not found" };
    }
    
    await updateDoc(userRef, {
      paymentMethods: arrayRemove(paymentToRemove),
      updatedAt: Timestamp.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error removing payment method:", error);
    return { error: error.message, success: false };
  }
};

/**
 * Add a new order to user profile and orders collection
 * 
 * @param {string} userId - Firebase Auth UID
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} - Success status and order ID
 */
export const createOrder = async (userId, orderData) => {
  try {
    // Generate a unique order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    
    // Create order in orders collection
    const orderRef = doc(db, "orders", orderId);
    await setDoc(orderRef, {
      orderId,
      userId,
      ...orderData,
      status: "pending",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    // Add order reference to user profile
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      orders: arrayUnion({
        orderId,
        amount: orderData.total,
        status: "pending",
        createdAt: Timestamp.now()
      }),
      updatedAt: Timestamp.now()
    });
    
    return { success: true, orderId };
  } catch (error) {
    console.error("Error creating order:", error);
    return { error: error.message, success: false };
  }
};

/**
 * Get all orders for a user
 * 
 * @param {string} userId - Firebase Auth UID
 * @returns {Promise<Object>} - Success status and orders array
 */
export const getUserOrders = async (userId) => {
  try {
    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const orders = [];
    
    querySnapshot.forEach((doc) => {
      orders.push(doc.data());
    });
    
    return { success: true, orders };
  } catch (error) {
    console.error("Error retrieving user orders:", error);
    return { error: error.message, success: false };
  }
};

/**
 * Get a specific order by ID
 * 
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} - Success status and order data
 */
export const getOrderById = async (orderId) => {
  try {
    const orderRef = doc(db, "orders", orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      return { success: false, error: "Order not found" };
    }
    
    return { success: true, order: orderDoc.data() };
  } catch (error) {
    console.error("Error retrieving order:", error);
    return { error: error.message, success: false };
  }
};