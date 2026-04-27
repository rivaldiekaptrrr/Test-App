// Re-export from new db client for backward compatibility
// This file maintains compatibility with existing code that imports from supabase/client

export {
  isDemoMode,
  getSessionOrDemo,
  getAuthToken,
  getCurrentUser,
  isAuthenticated,
  login,
  logout,
  signup,
  hasRole
} from '../db/client'

// Legacy supabase export - now null since we use Neon
export const supabase = null
