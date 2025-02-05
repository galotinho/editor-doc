// app/loop/page.tsx
import React from "react";
import DocxEditorLoop from "@/components/DocxEditorLoop";

export default function Page() {
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Gerar Documento com Loop</h2>
      <DocxEditorLoop />
    </div>
  );
}
