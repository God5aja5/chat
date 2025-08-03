import { useFirebaseAuth } from './useFirebaseAuth';

export function useAuth() {
  const { user, loading, isAuthenticated } = useFirebaseAuth();

  return {
    user: user ? {
      id: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      avatar: user.photoURL || undefined,
    } : null,
    isLoading: loading,
    isAuthenticated,
  };
}
