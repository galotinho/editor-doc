'use client';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchVariables = async () => {
      try {
        const response = await fetch('/api/variables');
        const data: { name: string, value: string }[] = await response.json();
        const vars = data.reduce((acc: Record<string, string>, curr: { name: string, value: string }) => ({
          ...acc, 
          [`${curr.name}`]: curr.value
        }), {});
        setVariables(vars);
      } catch (error) {
        console.error('Error fetching variables:', error);
      }
    };
    
    fetchVariables();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('variables', JSON.stringify(variables));

      const response = await fetch('/api/templates', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to generate document');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'documento-gerado.docx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

    } catch (error) {
      console.error('Generation error:', error);
      alert('Erro ao gerar documento!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Gerador de Documentos</h1>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6">
        <div className="mb-8">
          <label className="block text-lg font-medium text-gray-700 mb-3">
            Selecione seu template DOCX
          </label>
          <input
            type="file"
            accept=".docx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
            required
          />
        </div>

        {Object.keys(variables).length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-5">
              Preencha os valores das variáveis
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(variables).map(([name, value]) => (
                <div key={name} className="space-y-1">
                  <label className="block text-sm font-medium text-gray-600">
                    {name.replace(/[{}]/g, '')}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setVariables(prev => ({
                      ...prev,
                      [name]: e.target.value
                    }))}
                    className="w-full px-4 py-2 border rounded-lg
                      focus:ring-2 focus:ring-blue-500
                      focus:border-blue-500 outline-none
                      transition-all"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-6 text-lg font-semibold text-white rounded-lg
            transition-colors ${isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isLoading ? 'Gerando...' : 'Gerar Documento'}
        </button>
      </form>
    </div>
  );
}