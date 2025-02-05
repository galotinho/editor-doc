"use client";
import { useState } from "react";

interface Item {
  nome: string;
  cargo: string;
  image: string; // Novo campo para a URL da imagem
}

export default function DocxEditorLoop() {
  // Estado para armazenar o arquivo selecionado
  const [file, setFile] = useState<File | null>(null);

  // Estado para o array de items, incluindo a URL da imagem
  const [items, setItems] = useState<Item[]>([{ nome: "", cargo: "", image: "" }]);

  // Função para adicionar mais um item vazio
  const addItem = () => {
    setItems([...items, { nome: "", cargo: "", image: "" }]);
  };

  // Função para remover um item
  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  // Quando o usuário altera um campo (nome, cargo ou image)
  const updateItem = (index: number, field: keyof Item, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  // Função de envio
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Selecione um arquivo primeiro");
      return;
    }

    // Identifica o endpoint com base na extensão do arquivo
    let endpoint = "";
    if (file.name.toLowerCase().endsWith(".docx")) {
      endpoint = "/api/templates";
    } else if (file.name.toLowerCase().endsWith(".xlsx")) {
      endpoint = "/api/xlsx-template";
    } else {
      alert("Tipo de arquivo não suportado. Selecione um arquivo DOCX ou XLSX.");
      return;
    }

    // Monta as variáveis para o Docxtemplater/xlsx-template
    const variables = { items };

    // Cria o formData com o template e as variáveis
    const formData = new FormData();
    formData.append("file", file);
    formData.append("variables", JSON.stringify(variables));

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const { error } = await response.json();
        alert("Erro ao gerar documento: " + error);
        return;
      }

      // Obter o blob de resposta para download ou exibição
      const blob = await response.blob();

      // Criar um link e acionar o download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name; // ou outro nome desejado
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao enviar dados:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Template (DOCX ou XLSX):</label>
          <input
            type="file"
            accept=".docx,.xlsx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="file-input file-input-bordered"
          />
        </div>

        <h3 className="text-lg font-semibold">
          Itens (ex: experiências, seções etc.)
        </h3>
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-4 border border-gray-300 rounded-md mb-4 space-y-2"
          >
            {/* Campo: Nome */}
            <div className="flex items-center space-x-2">
              <label className="block">Nome:</label>
              <input
                type="text"
                value={item.nome}
                onChange={(e) => updateItem(idx, "nome", e.target.value)}
                className="input input-bordered"
              />
            </div>

            {/* Campo: Cargo */}
            <div className="flex items-center space-x-2">
              <label className="block">Cargo:</label>
              <input
                type="text"
                value={item.cargo}
                onChange={(e) => updateItem(idx, "cargo", e.target.value)}
                className="input input-bordered"
              />
            </div>

            {/* Novo Campo: URL da Imagem */}
            <div className="flex items-center space-x-2">
              <label className="block">URL da Imagem:</label>
              <input
                type="text"
                value={item.image}
                onChange={(e) => updateItem(idx, "image", e.target.value)}
                className="input input-bordered"
              />
            </div>

            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="btn btn-error"
            >
              Remover
            </button>
          </div>
        ))}

        <button type="button" onClick={addItem} className="btn btn-success">
          Adicionar Outro Item
        </button>

        <br />
        <button type="submit" className="btn btn-primary">
          Gerar Documento
        </button>
      </form>
    </div>
  );
}
