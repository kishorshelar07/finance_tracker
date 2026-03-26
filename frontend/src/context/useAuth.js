// Separated from AuthContext.jsx so Vite Fast Refresh can hot-swap each file
// independently. Fast Refresh requires a file to export ONLY components OR
// only non-component values — mixing both (AuthProvider + useAuth) caused
// "Could not Fast Refresh" warnings and fell back to full page reloads.
import { useContext } from 'react';
import { AuthContext } from './AuthContext';

const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default useAuth;
