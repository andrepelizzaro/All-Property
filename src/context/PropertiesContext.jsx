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
      .select('*');

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
    console.log('Iniciando cadastro de imóvel:', data);
    const { data: newProp, error } = await supabase
      .from('properties')
      .insert([data])
      .select();

    if (error) {
      console.error('ERRO CRÍTICO SUPABASE (Add Property):', error);
      return null;
    }
    
    console.log('Imóvel cadastrado com sucesso no DB:', newProp);
    await fetchProperties();
    return newProp[0]?.id;
  };

  const updateProperty = async (id, updates) => {
    console.log('Atualizando imóvel:', id, updates);
    const { error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('ERRO CRÍTICO SUPABASE (Update Property):', error);
    } else {
      console.log('Imóvel atualizado com sucesso no DB');
      await fetchProperties();
    }
  };

  const deleteProperty = async (id) => {
    console.log('Iniciando exclusão otimista:', id);
    const originalProperties = [...properties];
    setProperties(prev => prev.filter(p => p.id !== id));

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('ERRO CRÍTICO SUPABASE (Delete Property):', error);
      setProperties(originalProperties);
    } else {
      console.log('Imóvel excluído com sucesso do DB');
      await fetchProperties();
    }
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
