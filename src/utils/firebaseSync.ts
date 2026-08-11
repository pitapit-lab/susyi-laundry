import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  onSnapshot, 
  serverTimestamp,
  query,
  where,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { Customer } from '../types';
import { 
  getRegisteredUsers, 
  saveRegisteredUser, 
  findRegisteredUserByEmail 
} from './database';
import { CustomerService, OrderService, OperationType } from './services';

export { OperationType };

export function mapToFirestoreUser(customer: Customer, uid: string, providerOverride?: string): any {
  return CustomerService.mapToFirestore(customer, uid, providerOverride);
}

export function mapFromFirestoreUser(docData: any): Customer {
  return CustomerService.mapFromFirestore(docData);
}

// 1. Save or Update User in Firestore
export async function saveUserToFirestore(uid: string, customer: Customer, provider?: string): Promise<void> {
  if (customer.is_local_sandbox || !auth.currentUser) {
    console.warn('Sandbox or offline mode. Saving profile locally instead of Firestore.');
    saveRegisteredUser(customer);
    return;
  }
  await CustomerService.saveCustomer(uid, customer, provider);
}

// 2. Retrieve User from Firestore
export async function getUserFromFirestore(uid: string): Promise<Customer | null> {
  const userRef = doc(db, 'users', uid);
  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return CustomerService.mapFromFirestore(docSnap.data());
    }
    return null;
  } catch (error) {
    const isPermissionError = error instanceof Error && (
      error.message.includes('permission') || 
      error.message.includes('Permission') ||
      (error as any).code === 'permission-denied'
    );
    if (isPermissionError) {
      console.warn(`Firestore permission denied for users/${uid}. Falling back to local storage.`);
      const localUsers = getRegisteredUsers();
      if (uid === 'admin_laundry_placeholder_uid') {
        return localUsers.find(u => u.email === 'admin@laundry') || null;
      }
      if (uid === 'courier_laundry_placeholder_uid') {
        return localUsers.find(u => u.email === 'kurir@laundry' || u.email === 'kurir@laundry.com') || {
          uid: 'courier_laundry_placeholder_uid',
          name: 'Kurir Susyi Laundry',
          email: 'kurir@laundry',
          phone: '081234567890',
          address: 'Outlet Susyi Laundry',
          points: 0,
          role: 'courier',
          orders: []
        };
      }
      if (uid.startsWith('mock_uid_')) {
        const cleanEmail = uid.replace('mock_uid_', '').replace(/_/g, '.');
        return localUsers.find(u => u.email.toLowerCase() === cleanEmail.toLowerCase()) || null;
      }
      return null;
    }
    throw error;
  }
}

// 3. Find User by Email in Firestore
export async function findUserByEmailInFirestore(email: string): Promise<{ uid: string; customer: Customer } | null> {
  if (!auth.currentUser) {
    console.warn('Unauthenticated request to findUserByEmailInFirestore. Checking local storage.');
    const localUser = findRegisteredUserByEmail(email);
    if (localUser) {
      const mockUid = 'mock_uid_' + email.replace(/[@.]/g, '_');
      return { uid: mockUid, customer: localUser };
    }
    return null;
  }

  const usersCol = collection(db, 'users');
  const q = query(usersCol, where('email', '==', email.toLowerCase()));
  
  try {
    const querySnapshot = await getDocs(q);
    let found: { uid: string; customer: Customer } | null = null;
    querySnapshot.forEach((doc) => {
      found = {
        uid: doc.id,
        customer: CustomerService.mapFromFirestore(doc.data())
      };
    });
    return found;
  } catch (error) {
    const isPermissionError = error instanceof Error && (
      error.message.includes('permission') || 
      error.message.includes('Permission') ||
      (error as any).code === 'permission-denied'
    );
    if (isPermissionError) {
      console.warn(`Firestore permission denied for email query: ${email}. Falling back to local storage.`);
      const localUser = findRegisteredUserByEmail(email);
      if (localUser) {
        const mockUid = 'mock_uid_' + email.replace(/[@.]/g, '_');
        return { uid: mockUid, customer: localUser };
      }
      return null;
    }
    throw error;
  }
}

// 4. Seeding/Bootstrap existing LocalStorage registered users into Firestore
export async function bootstrapDemoUsersToFirestore(): Promise<void> {
  // Completely empty this function to avoid seeding any demo/mock users to Firestore
}

// 5. Listen to all users in Firestore (real-time updates) for Admin Dashboard
export function listenToUsersInFirestore(onUpdate: (users: Customer[]) => void): () => void {
  if (!auth.currentUser) {
    console.warn('Unauthenticated listener to users. Using local storage registered users instead.');
    onUpdate(getRegisteredUsers());
    return () => {};
  }
  return CustomerService.listenToCustomers(onUpdate);
}

// 6. Delete User from Firestore
export async function deleteUserFromFirestore(uid: string): Promise<void> {
  if (!uid) {
    console.warn(`Attempted to delete empty UID. Skipping Firestore deletion.`);
    return;
  }
  const userRef = doc(db, 'users', uid);
  try {
    await deleteDoc(userRef);
    console.log(`User with UID ${uid} deleted successfully from Firestore.`);
  } catch (error) {
    const isPermissionError = error instanceof Error && (
      error.message.includes('permission') || 
      error.message.includes('Permission') ||
      (error as any).code === 'permission-denied'
    );
    if (isPermissionError) {
      console.warn(`Firestore permission denied to delete users/${uid}.`);
      return;
    }
    throw error;
  }
}

export function normalizeEmailForAuth(email: string): string {
  const clean = email.trim().toLowerCase();
  if (clean === 'admin@laundry') {
    return 'admin@laundry.com';
  }
  if (clean === 'kurir@laundry') {
    return 'kurir@laundry.com';
  }
  return clean;
}

// 6. Seed default Admin account (disabled for security)
export async function seedAdminAccount(): Promise<void> {
  // Auto admin seeding is disabled. Admin accounts must be created directly in Firebase Console.
}
