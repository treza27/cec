import React, { createContext, useContext } from 'react';
import { useEmployeeProfile } from '../hooks/useEmployeeProfile';

type EmployeeProfileContextValue = ReturnType<typeof useEmployeeProfile>;

const EmployeeProfileContext = createContext<EmployeeProfileContextValue | null>(null);

export function EmployeeProfileProvider({ children }: { children: React.ReactNode }) {
  const value = useEmployeeProfile();
  return (
    <EmployeeProfileContext.Provider value={value}>
      {children}
    </EmployeeProfileContext.Provider>
  );
}

export function useEmployeeProfileContext(): EmployeeProfileContextValue {
  const ctx = useContext(EmployeeProfileContext);
  if (!ctx) {
    throw new Error('useEmployeeProfileContext must be used within EmployeeProfileProvider');
  }
  return ctx;
}
