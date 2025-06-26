// appwrite.js - Appwrite client configuration
let sdk;
let client;
let account;
let databases;
let storage;

// This function initializes the Appwrite SDK after it's loaded from CDN
export function initAppwrite() {
    if (typeof window.Appwrite === 'undefined') {
        console.error('Appwrite SDK not loaded. Make sure the CDN script is included in your HTML.');
        return null;
    }

    sdk = window.Appwrite;

    // Initialize Appwrite client
    client = new sdk.Client();
client
        .setEndpoint('https://cloud.appwrite.io/v1') // Update with your Appwrite endpoint
        .setProject('685772fb002a3f48779a'); // Update with your project ID

    // Initialize services
    account = new sdk.Account(client);
    databases = new sdk.Databases(client);
    storage = new sdk.Storage(client);

    return {
        client,
        account,
        databases,
        storage,
        sdk
    };
}

// Initialize Appwrite on script load
initAppwrite();

// Export services for use in other modules
export function getServices() {
    if (!client) {
        return initAppwrite();
    }
    
    return {
        client,
        account,
        databases,
        storage,
        sdk
    };
}

// Helper functions for common operations
export async function getCurrentSession() {
    try {
        const { account } = getServices();
        return await account.getSession('current');
    } catch (error) {
        console.error('Error getting current session:', error);
        return null;
    }
}

export async function isLoggedIn() {
    try {
        const session = await getCurrentSession();
        return !!session;
    } catch {
        return false;
    }
}

// Export ID utility
export const ID = sdk ? sdk.ID : { unique: () => `temp_${Math.random().toString(36).substr(2, 9)}` };

// Database collections
export const COLLECTIONS = {
    MEAL_PLANS: 'meal_plans',
    FAVORITES: 'favorites',
    USER_PREFERENCES: 'user_preferences'
};

// Helper function to get current user ID
export async function getCurrentUserId() {
    try {
        const { account } = getServices();
        const user = await account.get();
        return user.$id;
    } catch (error) {
        console.log('User not authenticated:', error);
        return null;
    }
}

// CRUD operations for Appwrite documents

// Create a new document
export async function createDocument(collectionId, data) {
    try {
        const { databases } = getServices();
        const databaseId = 'main'; // Replace with your database ID
        return await databases.createDocument(databaseId, collectionId, ID.unique(), data);
    } catch (error) {
        console.error('Error creating document:', error);
        throw error;
    }
}

// List documents with optional queries
export async function listDocuments(collectionId, queries = []) {
    try {
        const { databases } = getServices();
        const databaseId = 'main'; // Replace with your database ID
        return await databases.listDocuments(databaseId, collectionId, queries);
    } catch (error) {
        console.error('Error listing documents:', error);
        throw error;
    }
}

// Get a single document by ID
export async function getDocument(collectionId, documentId) {
    try {
        const { databases } = getServices();
        const databaseId = 'main'; // Replace with your database ID
        return await databases.getDocument(databaseId, collectionId, documentId);
    } catch (error) {
        console.error('Error getting document:', error);
        throw error;
    }
}

// Update an existing document
export async function updateDocument(collectionId, documentId, data) {
    try {
        const { databases } = getServices();
        const databaseId = 'main'; // Replace with your database ID
        return await databases.updateDocument(databaseId, collectionId, documentId, data);
    } catch (error) {
        console.error('Error updating document:', error);
        throw error;
    }
}

// Delete a document
export async function deleteDocument(collectionId, documentId) {
    try {
        const { databases } = getServices();
        const databaseId = 'main'; // Replace with your database ID
        return await databases.deleteDocument(databaseId, collectionId, documentId);
    } catch (error) {
        console.error('Error deleting document:', error);
        throw error;
    }
}

// Function to handle Google OAuth login
export const loginWithGoogle = async (successRedirect) => {
    try {
        // Default redirects
        const success = successRedirect || window.location.href;
        const failure = window.location.href;

        // Create OAuth2 session - this will redirect the user to Google login
        await account.createOAuth2Session(
            'google',  // provider
            success,   // success URL (redirects back to your app after successful login)
            failure    // failure URL
        );
    } catch (error) {
        console.error('Google OAuth error:', error);
        throw error;
    }
};

// Function to get current user
export const getCurrentUser = async () => {
    try {
        return await account.get();
    } catch (error) {
        console.error('Get user error:', error);
        return null;
    }
};

// Function to logout
export const logout = async () => {
    try {
        await account.deleteSession('current');
        return true;
    } catch (error) {
        console.error('Logout error:', error);
        return false;
    }
};

// Export client for advanced usage
export default {
    client,
    account,
    loginWithGoogle,
    getCurrentSession,
    isLoggedIn,
    getCurrentUser,
    logout
}; 