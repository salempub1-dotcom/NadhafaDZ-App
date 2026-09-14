import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

export type Neighborhood = 'بن يوب' | 'العميرات';

export function getNeighborhoodDisplayName(value: Neighborhood | string) {
  return value === 'العميرات' ? 'الحوش' : value;
}

type NeighborhoodContextValue = {
  neighborhood: Neighborhood;
  setNeighborhood: (value: Neighborhood) => Promise<void>;
  loading: boolean;
};

const STORAGE_KEY = 'nadhafadz.neighborhood';
const NeighborhoodContext = createContext<NeighborhoodContextValue | undefined>(undefined);

export function NeighborhoodProvider({ children }: PropsWithChildren) {
  const [neighborhood, setNeighborhoodState] = useState<Neighborhood>('بن يوب');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value === 'بن يوب' || value === 'العميرات') setNeighborhoodState(value);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<NeighborhoodContextValue>(() => ({
    neighborhood,
    loading,
    setNeighborhood: async (next) => {
      setNeighborhoodState(next);
      await AsyncStorage.setItem(STORAGE_KEY, next);
    },
  }), [neighborhood, loading]);

  return <NeighborhoodContext.Provider value={value}>{children}</NeighborhoodContext.Provider>;
}

export function useNeighborhood() {
  const value = useContext(NeighborhoodContext);
  if (!value) throw new Error('useNeighborhood must be used inside NeighborhoodProvider');
  return value;
}
