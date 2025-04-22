"use client"
import { useState } from 'react';
import { UploadCloud, X, CheckCircle, AlertCircle } from 'lucide-react';

export default function FileUploaderDialog({ onUploadSuccess, userId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);

  const openDialog = () => setIsOpen(true);
  const closeDialog = () => {
    setIsOpen(false);
    setFile(null);
    setMessage('');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateFile(selectedFile);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    validateFile(droppedFile);
  };

  const validateFile = (selectedFile) => {
    if (selectedFile && (selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.txt'))) {
      setFile(selectedFile);
      setMessage('');
    } else {
      setMessage('Please select a CSV or TXT file');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file first');
      return;
    }

    setIsUploading(true);
    setMessage('Processing file...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('File processed successfully!');
        if (onUploadSuccess) {
          onUploadSuccess(result.days);
          closeDialog(); // Close on successful upload
        }
      } else {
        setMessage(result.message || 'Error processing file');
      }
    } catch (error) {
      setMessage('Error uploading file: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={openDialog}
        className="inline-flex items-center gap-2 px-3 py-2 bg-white text-black rounded-full hover:bg-blue-300 transition-colors"
      >
        <UploadCloud className="w-5 h-5" />
      </button>

      {/* Dialog Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-100">
          {/* Dialog Container */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Upload Sensor Data</h2>
              <button
                onClick={closeDialog}
                className="p-1 rounded-full hover:bg-gray-100"
                disabled={isUploading}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <UploadCloud className={`w-8 h-8 ${
                      isDragActive ? 'text-blue-500' : 'text-gray-400'
                    }`} />
                    
                    <div className="flex text-sm text-gray-600">
                      <label 
                        htmlFor="file-upload" 
                        className="relative cursor-pointer font-medium text-blue-600 hover:text-blue-500"
                      >
                        <span>Click to upload</span>
                        <input 
                          id="file-upload" 
                          name="file-upload" 
                          type="file" 
                          accept=".csv,.txt"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      CSV files up to 10MB (Timestamp, Near, Medium, Far, Battery)
                    </p>
                  </div>
                </div>

                {file && (
                  <div className="mt-4 flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 line-clamp-1">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setFile(null)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                      disabled={isUploading}
                    >
                      Remove
                    </button>
                  </div>
                )}

                {message && (
                  <div className={`mt-4 flex items-start gap-2 p-3 rounded-lg ${
                    message.includes('success') 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {message.includes('success') ? (
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    )}
                    <p className="text-sm">{message}</p>
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={closeDialog}
                    disabled={isUploading}
                    className="flex-1 py-2.5 px-4 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || !file}
                    className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors ${
                      isUploading || !file 
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'Upload & Process'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}