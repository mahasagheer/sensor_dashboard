"use client"
import { useState } from 'react';

export default function FileUploader() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [downloadLink, setDownloadLink] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMessage('');
      setDownloadLink('');
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

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('File processed successfully!');
        setDownloadLink(result.path);
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
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Upload Text or CSV File</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select File (TXT or CSV)
          </label>
          <input
            type="file"
            accept=".txt,.csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>
        
        <button
          type="submit"
          disabled={isUploading || !file}
          className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isUploading || !file ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isUploading ? 'Processing...' : 'Upload & Convert'}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-md ${
          downloadLink ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {downloadLink && (
        <div className="mt-4">
          <a
            href={downloadLink}
            download
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Download Processed CSV File
          </a>
        </div>
      )}
    </div>
  );
}