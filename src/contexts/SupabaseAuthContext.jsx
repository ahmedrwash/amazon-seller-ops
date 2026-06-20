// This file is deprecated to avoid duplicate implementations.
// We re-export the primary AuthContext to ensure backward compatibility
// and consolidation of authentication logic.
export * from '@/context/AuthContext';
export { AuthProvider as default } from '@/context/AuthContext';