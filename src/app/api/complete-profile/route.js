import { createClient } from '@/utlis/supabase/server'
import { NextResponse } from 'next/server'
import { parse } from 'csv-parse/sync'

export async function PATCH(request) {
  try {
    // 1. Initialize Supabase client
    const supabase = await createClient()
    
    if (!supabase || typeof supabase.from !== 'function') {
      throw new Error('Supabase client not properly initialized')
    }

    // 2. Get form data
    const formData = await request.formData()
    const userId = formData.get('user_id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // 3. Prepare base update data
    const updateData = {
      company_name: formData.get('company_name'),
      client_name: formData.get('client_name'),
      updated_at: new Date().toISOString()
    }

    // 4. Process CSV/TXT file if present
    const csvFile = formData.get('csv_data')
    if (csvFile && csvFile.size > 0) {
      // Validate file type
      const allowedTypes = [
        'text/csv',
        'text/plain',
        'application/vnd.ms-excel'
      ]
      const fileExtension = csvFile.name.split('.').pop().toLowerCase()
      
      if (
        !allowedTypes.includes(csvFile.type) && 
        !['csv', 'txt'].includes(fileExtension)
      ) {
        return NextResponse.json(
          { error: 'Only CSV or TXT files are allowed' },
          { status: 400 }
        )
      }

      try {
        // Just store the raw file content without parsing
        const fileContent = await csvFile.text()
        updateData.csv_data = fileContent // Store in your existing text column
        
        // If you need to parse it later, you can do it when reading the data
        // For now, we're just storing the raw content
      } catch (error) {
        console.error('File processing error:', error)
        return NextResponse.json(
          { error: 'Failed to process file' },
          { status: 400 }
        )
      }
    }

    // 5. Update database
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select()

    if (error) throw error

    // 6. Return success response
    return NextResponse.json({ 
      success: true,
      data: data[0]
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}