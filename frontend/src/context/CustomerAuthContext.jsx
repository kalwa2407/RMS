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

  // Sync / fetch customer profile from backend with auto-refresh on 401
  const fetchCustomerProfile = useCallback(async (token, user) => {
    try {
      let activeToken = token;
      let res = await fetch(`${API_BASE}/api/customer/profile`, {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });

      // If 401 Unauthorized, force-refresh token once from Firebase and retry
      if (res.status === 401 && user) {
        try {
          activeToken = await user.getIdToken(true);
          setIdToken(activeToken);
          res = await fetch(`${API_BASE}/api/customer/profile`, {
            headers: {
              'Authorization': `Bearer ${activeToken}`
            }
          });
        } catch (refreshErr) {
          console.warn('Could not force-refresh token:', refreshErr);
        }
      }

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
      // Get fresh token
      let token = idToken;
      try {
        token = await currentUser.getIdToken();
        setIdToken(token);
      } catch (e) { /* use existing */ }

      let res = await fetch(`${API_BASE}/api/customer/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      // Auto-refresh on 401
      if (res.status === 401 && currentUser) {
        try {
          const freshToken = await currentUser.getIdToken(true);
          setIdToken(freshToken);
          res = await fetch(`${API_BASE}/api/customer/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${freshToken}`
            },
            body: JSON.stringify(updateData)
          });
        } catch (refreshErr) {
          console.warn('Token refresh for profile update failed:', refreshErr);
        }
      }

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

  // Send WhatsApp OTP
  const sendWhatsAppOtp = async (phone) => {
    try {
      const res = await fetch(`${API_BASE}/api/customer/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to send verification code');
      }
      return { success: true, message: data.message, resendCoolDown: data.resend_cool_down };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Verify WhatsApp OTP
  const verifyWhatsAppOtp = async (phone, otp, name = '') => {
    try {
      const res = await fetch(`${API_BASE}/api/customer/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, name })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid verification code');
      }

      localStorage.setItem('customer_jwt', data.token);
      if (data.customer?.phone) localStorage.setItem('customer_phone', data.customer.phone);
      if (data.customer?.address) localStorage.setItem('customer_address', data.customer.address);

      const userObj = {
        uid: data.customer.uid,
        displayName: data.customer.name,
        name: data.customer.name,
        phone: data.customer.phone,
        email: data.customer.email,
        isWhatsAppUser: true,
        getIdToken: async () => data.token
      };

      setCurrentUser(userObj);
      setIdToken(data.token);
      setCustomerProfile(data.customer);
      return { success: true, customer: data.customer };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Sign Out
  const signOutCustomer = async () => {
    try {
      localStorage.removeItem('customer_jwt');
      localStorage.removeItem('customer_phone');
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
          localStorage.removeItem('customer_jwt');
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

  // Listen to Auth State + Check stored JWT on boot
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
        setLoading(false);
      } else {
        // If not logged in via Firebase Google Auth, check for stored WhatsApp JWT
        const storedJwt = localStorage.getItem('customer_jwt');
        if (storedJwt) {
          try {
            const res = await fetch(`${API_BASE}/api/customer/profile`, {
              headers: { 'Authorization': `Bearer ${storedJwt}` }
            });
            if (res.ok) {
              const profile = await res.json();
              const userObj = {
                uid: profile.uid,
                displayName: profile.name,
                name: profile.name,
                phone: profile.phone,
                email: profile.email,
                isWhatsAppUser: true,
                getIdToken: async () => storedJwt
              };
              setCurrentUser(userObj);
              setIdToken(storedJwt);
              setCustomerProfile(profile);
            } else {
              localStorage.removeItem('customer_jwt');
              setCurrentUser(null);
              setIdToken(null);
              setCustomerProfile(null);
            }
          } catch (jwtErr) {
            console.warn('Stored JWT restore failed:', jwtErr);
          }
        } else {
          setCurrentUser(null);
          setIdToken(null);
          setCustomerProfile(null);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchCustomerProfile]);

  // Authenticated fetch wrapper with automatic token refresh on 401
  const fetchWithAuth = useCallback(async (url, options = {}) => {
    let token = idToken;
    if (!token && auth.currentUser) {
      try {
        token = await auth.currentUser.getIdToken();
        setIdToken(token);
      } catch (e) {
        console.warn('Could not get current token:', e);
      }
    }

    const headers = {
      ...(options.headers || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    let res = await fetch(url, { ...options, headers });

    // If 401 Unauthorized, force-refresh token once and retry
    if (res.status === 401 && auth.currentUser) {
      try {
        const freshToken = await auth.currentUser.getIdToken(true);
        setIdToken(freshToken);
        const retryHeaders = {
          ...(options.headers || {}),
          'Authorization': `Bearer ${freshToken}`
        };
        res = await fetch(url, { ...options, headers: retryHeaders });
      } catch (refreshErr) {
        console.warn('Token refresh retry failed:', refreshErr);
      }
    }

    return res;
  }, [idToken]);

  return (
    <CustomerAuthContext.Provider
      value={{
        currentUser,
        idToken,
        customerProfile,
        loading,
        signInWithGoogle,
        sendWhatsAppOtp,
        verifyWhatsAppOtp,
        signOutCustomer,
        updateProfile,
        fetchWithAuth,
        refreshProfile: async () => {
          if (!currentUser) return null;
          try {
            const freshToken = await currentUser.getIdToken(true);
            setIdToken(freshToken);
            return await fetchCustomerProfile(freshToken, currentUser);
          } catch (e) {
            if (idToken) return await fetchCustomerProfile(idToken, currentUser);
            return null;
          }
        }
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
