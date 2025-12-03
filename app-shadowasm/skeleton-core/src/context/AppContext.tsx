import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Workspace } from '../types';
import { users } from '../data/mockData';

interface AppContextType {
  activeUser: User;
  setActiveUser: (user: User) => void;
  activeWorkspace: Workspace;
  setActiveWorkspace: (workspace: Workspace) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeUser, setActiveUser] = useState<User>(users[0]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>('DEV');

  return (
    <AppContext.Provider value={{ activeUser, setActiveUser, activeWorkspace, setActiveWorkspace }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
