import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ENTITIES } from '../data/mockTitanData';
import { CorporateEntity } from '../types/titan';

interface EntityContextType {
  activeEntityId: string;
  setActiveEntityId: (id: string) => void;
  activeEntity: CorporateEntity;
}

const EntityContext = createContext<EntityContextType | undefined>(undefined);

export function EntityProvider({ children }: { children: ReactNode }) {
  const [activeEntityId, setActiveEntityId] = useState<string>(ENTITIES[0].id);
  const activeEntity = ENTITIES.find(e => e.id === activeEntityId) || ENTITIES[0];

  return (
    <EntityContext.Provider value={{ activeEntityId, setActiveEntityId, activeEntity }}>
      {children}
    </EntityContext.Provider>
  );
}

export function useEntityContext() {
  const context = useContext(EntityContext);
  if (context === undefined) {
    throw new Error('useEntityContext must be used within an EntityProvider');
  }
  return context;
}
