// components/DocxEditor.tsx
'use client';
import { useState } from 'react';

export default function DocxEditor() {
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select a DOCX file.");
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/templates', {
      method: 'POST',
      body: formData
    });
    
    const { url, filename } = await response.json();
    
    // Opções de exibição:
    console.log('Documento disponível em:', url);
    window.open(url, '_blank'); // Abrir em nova aba
    // Ou criar link download:
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  return (
    <div className="container mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Template DOCX:</label>
          <input
            type="file"
            accept=".docx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="file-input file-input-bordered"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(variables).map(([name, value]) => (
            <div key={name} className="form-control">
              <label className="label">
                <span className="label-text">{name.replace(/{{|}}/g, '')}</span>
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => setVariables({...variables, [name]: e.target.value})}
                className="input input-bordered"
              />
            </div>
          ))}
        </div>

        <button type="submit" className="btn btn-primary">
          Gerar Documento
        </button>
      </form>
    </div>
  );
}