import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const PropertiesContext = createContext(null);

export const useProperties = () => {
  const ctx = useContext(PropertiesContext);
  if (!ctx) throw new Error('useProperties must be used within PropertiesProvider');
  return ctx;
};

export const PropertiesProvider = ({ children }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = async () => {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar imóveis:', error);
      return;
    }
    setProperties(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProperties();

    // Sincronização em Tempo Real para Imóveis
    const channel = supabase
      .channel('public:properties')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, () => {
        fetchProperties();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addProperty = async (data) => {
    const { data: newProp, error } = await supabase
      .from('properties')
      .insert([data])
      .select();

    if (error) {
      console.error('Erro ao adicionar imóvel:', error);
      return null;
    }
    return newProp[0].id;
  };

  const updateProperty = async (id, updates) => {
    const { error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id);

    if (error) console.error('Erro ao atualizar imóvel:', error);
  };

  const deleteProperty = async (id) => {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) console.error('Erro ao excluir imóvel:', error);
  };

  return (
    <PropertiesContext.Provider value={{
      properties,
      loading,
      addProperty,
      updateProperty,
      deleteProperty
    }}>
      {children}
    </PropertiesContext.Provider>
  );
};
