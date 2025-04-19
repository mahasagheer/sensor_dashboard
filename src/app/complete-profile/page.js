'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CompleteProfile() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')
  const [csvFile, setCsvFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const router = useRouter()

  // Get user ID from localStorage
  useEffect(() => {
    const userDetailString = localStorage.getItem("currentUser")
    if (userDetailString) {
      const userDetail = JSON.parse(userDetailString)
      setUserId(userDetail.id)
    }
  }, [])

  const handleFileChange = (e) => {
    setFileError('')
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const validTypes = ['text/csv', 'text/plain', 'application/vnd.ms-excel']
      const fileExtension = file.name.split('.').pop().toLowerCase()
      
      if (
        validTypes.includes(file.type) || 
        fileExtension === 'csv' || 
        fileExtension === 'txt'
      ) {
        setCsvFile(file)
      } else {
        setFileError('Only CSV or TXT files are allowed')
        e.target.value = '' // Clear the file input
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!userId) {
      setError('User ID not found')
      return
    }

    if (fileError) {
      return
    }

    setLoading(true)
    setError('')
    
    const formData = new FormData()
    formData.append('user_id', userId)
    formData.append('company_name', e.target.company_name.value)
    formData.append('client_name', e.target.client_name.value)
    
    // Append CSV file if selected
    if (csvFile) {
      formData.append('csv_data', csvFile)
    }

    try {
      const response = await fetch('/api/complete-profile', {
        method: 'PATCH',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Update failed')
      }

      router.push('/login')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
    <form onSubmit={handleSubmit} className="space-y-4 p-10 rounded-2xl bg-white">
      <div>
        <label className="block mb-1">Company Name</label>
        <input 
          name="company_name" 
          required 
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block mb-1">Client Name</label>
        <input 
          name="client_name" 
          required 
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block mb-1">CSV/TXT File (Optional)</label>
        <input
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          onChange={handleFileChange}
          className="w-full p-2 border rounded"
        />
        {csvFile && (
          <p className="text-sm mt-1">Selected file: {csvFile.name}</p>
        )}
        {fileError && (
          <p className="text-red-500 text-sm mt-1">{fileError}</p>
        )}
      </div>

      <button 
        type="submit" 
        disabled={loading || !userId}
        className={`w-full py-2 px-4 rounded text-white ${
          loading || !userId ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? 'Updating...' : 'Update Profile'}
      </button>

      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </form>
    </div>
    </div>
  )
}