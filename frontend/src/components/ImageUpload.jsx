import { useState, useRef } from "react";

const ImageUpload = ({ onFileSelect }) => {
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setPreview(URL.createObjectURL(file));
    onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current.click()}
      className={`w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
        ${dragging ? "border-[#6c3483] bg-[#6c3483]/10" : "border-gray-600 hover:border-[#6c3483] bg-[#16162a]"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {preview ? (
        <div className="space-y-3">
          <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
          <p className="text-gray-400 text-sm">Click or drag to replace image</p>
        </div>
      ) : (
        <div className="space-y-2 py-4">
          <p className="text-4xl">🖼️</p>
          <p className="text-white font-bold">Drag & drop your artwork here</p>
          <p className="text-gray-400 text-sm">or click to browse files</p>
          <p className="text-gray-600 text-xs">PNG, JPG, WEBP supported</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;