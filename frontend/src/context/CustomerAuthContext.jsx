import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import API_BASE from '../lib/config';

const CustomerAuthContext = createContext(null);

export const CustomerAuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync / fetch customer profile from backend
  const fetchCustomerProfile = useCallback(async (token, user) => {
    try {
      const res = await fetch(`${API_BASE}/api/customer/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCustomerProfile(data);
        if (data.phone) {
          localStorage.setItem('customer_phone', data.phone);
        }
        if (data.address) {
          localStorage.setItem('customer_address', data.address);
        }
        return data;
      }
    } catch (err) {
      console.warn('Could not fetch remote customer profile:', err);
    }

    // Fallback profile if backend route unavailable
    const fallbackProfile = {
      uid: user.uid,
      name: user.displayName || 'Customer',
      email: user.email,
      picture: user.photoURL,
      phone: localStorage.getItem('customer_phone') || '',
      address: localStorage.getItem('customer_address') || '',
      addresses: []
    };
    setCustomerProfile(fallbackProfile);
    return fallbackProfile;
  }, []);

  // Update customer profile (Phone number, Address, Name)
  const updateProfile = async (updateData) => {
    if (!currentUser || !idToken) {
      // If guest or no token, save to localStorage
      if (updateData.phone) localStorage.setItem('customer_phone', updateData.phone);
      if (updateData.address) localStorage.setItem('customer_address', updateData.address);
      setCustomerProfile(prev => ({ ...(prev || {}), ...updateData }));
      return { success: true };
    }

    try {
      const res = await fetch(`${API_BASE}/api/customer/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        const updated = await res.json();
        setCustomerProfile(updated);
        if (updated.phone) localStorage.setItem('customer_phone', updated.phone);
        if (updated.address) localStorage.setItem('customer_address', updated.address);
        return { success: true, profile: updated };
      } else {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      // Still update locally for smooth UX
      setCustomerProfile(prev => ({ ...(prev || {}), ...updateData }));
      if (updateData.phone) localStorage.setItem('customer_phone', updateData.phone);
      if (updateData.address) localStorage.setItem('customer_address', updateData.address);
      return { success: true, warning: 'Saved locally' };
    }
  };

  // Google Sign-In — try popup first, fallback to redirect for COOP-blocked environments
  const signInWithGoogle = async () => {
    try {
      // Try popup first (works on localhost and same-origin)
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const token = await user.getIdToken();
      setCurrentUser(user);
      setIdToken(token);
      await fetchCustomerProfile(token, user);
      return { success: true, user };
    } catch (error) {
      // If popup blocked by COOP or browser policy, fall back to redirect
      if (
        error.code === 'auth/popup-blocked' ||
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/unauthorized-domain' ||
        error.message?.includes('Cross-Origin-Opener-Policy')
      ) {
        try {
          await signInWithRedirect(auth, googleProvider);
          // Page will reload — result handled by getRedirectResult in useEffect
          return { success: true, redirecting: true };
        } catch (redirectError) {
          console.error('Redirect Sign-In Error:', redirectError);
          return { success: false, error: redirectError.message };
        }
      }
      console.error('Google Sign-In Error:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign Out
  const signOutCustomer = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setIdToken(null);
      setCustomerProfile(null);
      return { success: true };
    } catch (error) {
      console.error('Sign Out Error:', error);
      return { success: false, error: error.message };
    }
  };

  // Handle redirect result (for signInWithRedirect fallback)
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const user = result.user;
          const token = await user.getIdToken();
          setCurrentUser(user);
          setIdToken(token);
          await fetchCustomerProfile(token, user);
        }
      })
      .catch((err) => {
        if (err.code !== 'auth/popup-closed-by-user') {
          console.error('Redirect result error:', err);
        }
      });
  }, [fetchCustomerProfile]);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          setCurrentUser(user);
          setIdToken(token);
          await fetchCustomerProfile(token, user);
        } catch (err) {
          console.error('Auth state change error:', err);
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
        setIdToken(null);
        setCustomerProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchCustomerProfile]);

  return (
    <CustomerAuthContext.Provider
      value={{
        currentUser,
        idToken,
        customerProfile,
        loading,
        signInWithGoogle,
        signOutCustomer,
        updateProfile,
        refreshProfile: () => idToken && currentUser && fetchCustomerProfile(idToken, currentUser)
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};
