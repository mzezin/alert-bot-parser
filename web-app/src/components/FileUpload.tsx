import React, { useRef } from 'react';

interface FileUploadProps {
  onFileLoad: (data: any) => void;
  accept: string;
  label: string;
  description: string;
}

export const FileUpload = ({ onFileLoad, accept, label, description }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const jsonData = JSON.parse(content);
        onFileLoad(jsonData);
      } catch (error) {
        console.error('Ошибка при парсинге JSON:', error);
        alert('Ошибка: не удалось прочитать файл. Проверьте, что это корректный JSON файл.');
      }
    };
    reader.readAsText(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mb-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept={accept}
        style={{ display: 'none' }}
      />
      <button
        onClick={handleClick}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
      >
        {label}
      </button>
      <span className="text-gray-600 text-sm">{description}</span>
    </div>
  );
};