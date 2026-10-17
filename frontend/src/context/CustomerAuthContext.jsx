import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import API_BASE from '../lib/config';

// Ensure Firebase Auth session is persisted across all app restarts
try {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
} catch (e) {}

const CustomerAuthContext = createContext(null);

export const CustomerAuthProvider = ({ children }) => {
  // Initialize auth state directly from localStorage so user stays logged in across app restarts
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const token = localStorage.getItem('customer_jwt');
      const savedProfileStr = localStorage.getItem('customer_profile');
      const name = localStorage.getItem('customer_name');
      const phone = localStorage.getItem('customer_phone');
      const email = localStorage.getItem('customer_email');
      const photo = localStorage.getItem('customer_photo');
      const uid = localStorage.getItem('customer_uid');
      const provider = localStorage.getItem('customer_login_provider');

      if (token && (uid || phone || email || name)) {
        return {
          uid: uid || (phone ? `wa_${phone}` : 'cust_stored'),
          displayName: name || (phone ? `Guest ${phone.slice(-4)}` : 'Valued Patron'),
          name: name || '',
          phone: phone || '',
          email: email || '',
          photoURL: photo || null,
          isWhatsAppUser: provider === 'phone',
          getIdToken: async () => token
        };
      }
    } catch (e) {}
    return null;
  });

  const [idToken, setIdToken] = useState(() => {
    try {
      return localStorage.getItem('customer_jwt') || null;
    } catch (e) {
      return null;
    }
  });

  const [customerProfile, setCustomerProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('customer_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [loading, setLoading] = useState(false);

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
      if (res.status === 401 && user && typeof user.getIdToken === 'function') {
        try {
          activeToken = await user.getIdToken(true);
          setIdToken(activeToken);
          localStorage.setItem('customer_jwt', activeToken);
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
        localStorage.setItem('customer_profile', JSON.stringify(data));
        if (data.name) localStorage.setItem('customer_name', data.name);
        if (data.phone) localStorage.setItem('customer_phone', data.phone);
        if (data.address) localStorage.setItem('customer_address', data.address);
        if (data.email) localStorage.setItem('customer_email', data.email);
        return data;
      }
    } catch (err) {
      console.warn('Could not fetch remote customer profile:', err);
    }

    // Fallback profile if backend route unavailable
    const fallbackProfile = {
      uid: user?.uid || 'cust_guest',
      name: user?.displayName || user?.name || localStorage.getItem('customer_name') || 'Valued Patron',
      email: user?.email || localStorage.getItem('customer_email') || '',
      picture: user?.photoURL || localStorage.getItem('customer_photo') || '',
      phone: user?.phoneNumber || localStorage.getItem('customer_phone') || '',
      address: localStorage.getItem('customer_address') || '',
      addresses: []
    };
    setCustomerProfile(fallbackProfile);
    localStorage.setItem('customer_profile', JSON.stringify(fallbackProfile));
    return fallbackProfile;
  }, []);

  // Update customer profile (Phone number, Address, Name)
  const updateProfile = async (updateData) => {
    if (updateData.name) localStorage.setItem('customer_name', updateData.name);
    if (updateData.phone) localStorage.setItem('customer_phone', updateData.phone);
    if (updateData.address) localStorage.setItem('customer_address', updateData.address);

    setCustomerProfile(prev => {
      const merged = { ...(prev || {}), ...updateData };
      localStorage.setItem('customer_profile', JSON.stringify(merged));
      return merged;
    });

    if (!currentUser || !idToken) {
      return { success: true };
    }

    try {
      let token = idToken;
      if (currentUser && typeof currentUser.getIdToken === 'function') {
        try {
          token = await currentUser.getIdToken();
          setIdToken(token);
        } catch (e) { /* use existing */ }
      }

      let res = await fetch(`${API_BASE}/api/customer/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        const updated = await res.json();
        setCustomerProfile(updated);
        localStorage.setItem('customer_profile', JSON.stringify(updated));
        if (updated.phone) localStorage.setItem('customer_phone', updated.phone);
        if (updated.address) localStorage.setItem('customer_address', updated.address);
        return { success: true, profile: updated };
      }
    } catch (err) {
      console.warn('Profile update remote sync error:', err);
    }
    return { success: true, warning: 'Saved locally' };
  };

  // Google Sign-In — use redirect on mobile/iOS (where COOP blocks popups), popup on desktop
  const signInWithGoogle = async () => {
    const isNative = typeof window !== 'undefined' && window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform();
    const isMobile = /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    // On native iOS/Android shell, attempt popup first (redirect navigates the native app webview out to Google)
    if (isNative) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        const token = await user.getIdToken();

        localStorage.setItem('customer_jwt', token);
        localStorage.setItem('customer_login_provider', 'google');
        if (user.uid) localStorage.setItem('customer_uid', user.uid);
        if (user.displayName) localStorage.setItem('customer_name', user.displayName);
        if (user.email) localStorage.setItem('customer_email', user.email);
        if (user.photoURL) localStorage.setItem('customer_photo', user.photoURL);

        setCurrentUser(user);
        setIdToken(token);
        await fetchCustomerProfile(token, user);
        return { success: true, user };
      } catch (nativeErr) {
        console.warn('Native Google popup error, attempting redirect fallback:', nativeErr);
        try {
          await signInWithRedirect(auth, googleProvider);
          return { success: true, redirecting: true };
        } catch (redirectErr) {
          return {
            success: false,
            error: 'Google Sign-in is restricted on iOS WebView. Please log in using Instant WhatsApp OTP (+91).'
          };
        }
      }
    }

    if (isMobile || isIOS) {
      // On mobile web browser: go straight to redirect
      try {
        await signInWithRedirect(auth, googleProvider);
        return { success: true, redirecting: true };
      } catch (redirectError) {
        console.error('Redirect Sign-In Error:', redirectError);
        return { success: false, error: redirectError.message };
      }
    }

    // Desktop: try popup first
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const token = await user.getIdToken();

      localStorage.setItem('customer_jwt', token);
      localStorage.setItem('customer_login_provider', 'google');
      if (user.uid) localStorage.setItem('customer_uid', user.uid);
      if (user.displayName) localStorage.setItem('customer_name', user.displayName);
      if (user.email) localStorage.setItem('customer_email', user.email);
      if (user.photoURL) localStorage.setItem('customer_photo', user.photoURL);

      setCurrentUser(user);
      setIdToken(token);
      await fetchCustomerProfile(token, user);
      return { success: true, user };
    } catch (error) {
      // Fallback to redirect if popup fails on desktop too
      if (
        error.code === 'auth/popup-blocked' ||
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request' ||
        error.message?.includes('Cross-Origin-Opener-Policy')
      ) {
        try {
          await signInWithRedirect(auth, googleProvider);
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
      localStorage.setItem('customer_login_provider', 'phone');
      if (data.customer?.uid) localStorage.setItem('customer_uid', data.customer.uid);
      if (data.customer?.name) localStorage.setItem('customer_name', data.customer.name);
      if (data.customer?.phone) localStorage.setItem('customer_phone', data.customer.phone);
      if (data.customer?.address) localStorage.setItem('customer_address', data.customer.address);
      if (data.customer?.email) localStorage.setItem('customer_email', data.customer.email);
      localStorage.setItem('customer_profile', JSON.stringify(data.customer));

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

  // Sign Out — strictly clears all cached session data
  const signOutCustomer = async () => {
    try {
      localStorage.removeItem('customer_jwt');
      localStorage.removeItem('customer_phone');
      localStorage.removeItem('customer_address');
      localStorage.removeItem('customer_email');
      localStorage.removeItem('customer_name');
      localStorage.removeItem('customer_photo');
      localStorage.removeItem('customer_uid');
      localStorage.removeItem('customer_login_provider');
      localStorage.removeItem('customer_profile');
      localStorage.removeItem('customer_saved_addresses');
      sessionStorage.clear();
      await firebaseSignOut(auth).catch(() => {});
    } catch (error) {
      console.warn('Sign Out Error:', error);
    } finally {
      setCurrentUser(null);
      setIdToken(null);
      setCustomerProfile(null);
    }
    return { success: true };
  };

  // Handle redirect result (for signInWithRedirect fallback)
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const user = result.user;
          const token = await user.getIdToken();
          localStorage.setItem('customer_jwt', token);
          localStorage.setItem('customer_login_provider', 'google');
          if (user.uid) localStorage.setItem('customer_uid', user.uid);
          if (user.displayName) localStorage.setItem('customer_name', user.displayName);
          if (user.email) localStorage.setItem('customer_email', user.email);
          if (user.photoURL) localStorage.setItem('customer_photo', user.photoURL);

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
          localStorage.setItem('customer_jwt', token);
          localStorage.setItem('customer_login_provider', 'google');
          if (user.uid) localStorage.setItem('customer_uid', user.uid);
          if (user.displayName) localStorage.setItem('customer_name', user.displayName);
          if (user.email) localStorage.setItem('customer_email', user.email);
          if (user.photoURL) localStorage.setItem('customer_photo', user.photoURL);

          setCurrentUser(user);
          setIdToken(token);
          await fetchCustomerProfile(token, user);
        } catch (err) {
          console.error('Auth state change error:', err);
          setCurrentUser(user);
        }
        setLoading(false);
      } else {
        // If not logged in via Firebase Google Auth, verify if user is logged in via Phone / stored JWT
        const storedJwt = localStorage.getItem('customer_jwt');
        const storedProvider = localStorage.getItem('customer_login_provider');

        if (storedJwt && storedProvider === 'phone') {
          // Keep user logged in via Phone OTP!
          const storedPhone = localStorage.getItem('customer_phone') || '';
          const storedName = localStorage.getItem('customer_name') || `Guest ${storedPhone.slice(-4)}`;
          const storedEmail = localStorage.getItem('customer_email') || '';
          const storedUid = localStorage.getItem('customer_uid') || `wa_${storedPhone}`;

          const userObj = {
            uid: storedUid,
            displayName: storedName,
            name: storedName,
            phone: storedPhone,
            email: storedEmail,
            isWhatsAppUser: true,
            getIdToken: async () => storedJwt
          };

          setCurrentUser(userObj);
          setIdToken(storedJwt);

          // Background revalidate
          fetch(`${API_BASE}/api/customer/profile`, {
            headers: { 'Authorization': `Bearer ${storedJwt}` }
          })
            .then(res => res.ok ? res.json() : null)
            .then(profile => {
              if (profile) {
                setCustomerProfile(profile);
                localStorage.setItem('customer_profile', JSON.stringify(profile));
              }
            })
            .catch(() => {});
        } else if (!storedJwt) {
          // Truly logged out or fresh install
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
