// app/(main)/variables/page.tsx
'use client';
import { useState, useEffect } from 'react';

export default function VariablesPage() {
  const [variables, setVariables] = useState<{id: string, name: string, value: string}[]>([]);
  const [editVariable, setEditVariable] = useState<{id?: string, name: string, value: string}>({name: '', value: ''});

  const fetchVariables = async () => {
    const response = await fetch('/api/variables');
    const data = await response.json();
    setVariables(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const method = editVariable.id ? 'PUT' : 'POST';
    const url = editVariable.id ? `/api/variables/${editVariable.id}` : '/api/variables';

    await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(editVariable),
    });

    setEditVariable({name: '', value: ''});
    fetchVariables();
  };

  const deleteVariable = async (id: string) => {
    await fetch(`/api/variables/${id}`, { method: 'DELETE' });
    fetchVariables();
  };

  useEffect(() => {
    fetchVariables();
  }, []);

  return (
    <div className="max-w-4xl ml-64 p-8"> {/* Adicione margin-left e padding */}
      <h1 className="text-2xl font-bold mb-6">Gerenciar Variáveis</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Nome da variável"
            className="input input-bordered"
            value={editVariable.name}
            onChange={(e) => setEditVariable({...editVariable, name: e.target.value})}
          />
          <input
            type="text"
            placeholder="Valor padrão"
            className="input input-bordered"
            value={editVariable.value}
            onChange={(e) => setEditVariable({...editVariable, value: e.target.value})}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          {editVariable.id ? 'Atualizar' : 'Cadastrar'} Variável
        </button>
      </form>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Variável</th>
              <th className="px-6 py-3 text-left">Valor</th>
              <th className="px-6 py-3 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {variables.map((variable) => (
              <tr key={variable.id} className="border-t">
                <td className="px-6 py-4">{variable.name}</td>
                <td className="px-6 py-4">{variable.value}</td>
                <td className="px-6 py-4 space-x-2">
                  <button
                    onClick={() => setEditVariable(variable)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteVariable(variable.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}