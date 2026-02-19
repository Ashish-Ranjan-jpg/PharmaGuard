import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  deleteUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, displayName) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    // Create user profile in Firestore
    await setDoc(doc(db, 'users', result.user.uid), {
      email,
      displayName,
      createdAt: new Date().toISOString(),
      analysisCount: 0,
      lastActive: new Date().toISOString(),
      dob: '',
      gender: '',
      bloodGroup: '',
      phone: '',
    });
    return result;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    // Create/update user profile in Firestore
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        createdAt: new Date().toISOString(),
        analysisCount: 0,
        lastActive: new Date().toISOString(),
        dob: '',
        gender: '',
        bloodGroup: '',
        phone: '',
      });
    }
    return result;
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  async function updateProfileData(data) {
    if (!currentUser) return;
    await updateDoc(doc(db, 'users', currentUser.uid), {
      ...data,
      lastActive: new Date().toISOString(),
    });
    if (data.displayName) {
      await updateProfile(currentUser, { displayName: data.displayName });
    }
  }

  async function updateUserPhoto(photoURL) {
    if (!currentUser) return;
    await updateProfile(currentUser, { photoURL });
    await updateDoc(doc(db, 'users', currentUser.uid), {
      photoURL,
      lastActive: new Date().toISOString(),
    });
  }

  async function deleteUserAccount() {
    if (!currentUser) return;
    const uid = currentUser.uid;
    await deleteDoc(doc(db, 'users', uid));
    await deleteUser(currentUser);
  }

  async function syncAnalysisCount(user) {
    if (!user) return;
    try {
      const q = query(collection(db, 'analyses'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const actualCount = snapshot.size;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().analysisCount !== actualCount) {
        await updateDoc(doc(db, 'users', user.uid), {
          analysisCount: actualCount
        });
        console.log(`Synced analysisCount for ${user.uid}: ${actualCount}`);
      }
    } catch (error) {
      console.error('Error syncing analysis count:', error);
    }
  }

  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Start real-time profile sync
        unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (doc) => {
          if (doc.exists()) {
            setUserProfile(doc.data());
          }
        });

        // Background sync of analysis count to fix any inconsistencies
        syncAnalysisCount(user);
      } else {
        setUserProfile(null);
        if (unsubscribeProfile) unsubscribeProfile();
      }
      
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateProfileData,
    updateUserPhoto,
    deleteUserAccount,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
