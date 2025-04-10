import { NextResponse } from 'next/server';
import { stringify } from 'csv-stringify/sync';
import path from 'path';
import { promises as fsPromises } from 'fs';
import supabase from '@/lib/supabase';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { message: 'No file uploaded' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const content = Buffer.from(buffer).toString('utf-8');
    const originalName = file.name;
    const isTextFile = originalName.endsWith('.txt');

    let csvData;
    let outputFileName = originalName.replace(/\.txt$/, '.csv');

    if (isTextFile) {
      const lines = content.split('\n')
        .filter(line => line.trim() !== '')
        .slice(1); // Skip header line
      
      const headers = ['Timestamp', 'Near', 'Medium', 'Far', 'Battery', 'BeaconID'];
      
      // Process data for Supabase (numeric values without %)
      const supabaseData = lines.map(line => {
        const row = {
          Timestamp: '',
          Near: null,
          Medium: null,
          Far: null,
          Battery: null,
          BeaconID: '1'
        };

        const firstComma = line.indexOf(',');
        if (firstComma > 0) {
          const timestampPart = line.substring(0, firstComma).trim();
          row.Timestamp = timestampPart;
        }

        // Process the rest of the data for Supabase
        const remaining = line.substring(firstComma + 1);
        remaining.split(',').forEach(pair => {
          const [key, value] = pair.split(':').map(item => item.trim());
          if (key && value && row.hasOwnProperty(key)) {
            // Remove % and convert to number for numeric fields
            if (['Near', 'Medium', 'Far', 'Battery'].includes(key)) {
              const numericValue = value.includes('%') 
                ? parseFloat(value.replace('%', '')) 
                : parseFloat(value);
              row[key] = isNaN(numericValue) ? null : numericValue;
            } else {
              row[key] = value;
            }
          }
        });
        
        return row;
      });

      // Process data for CSV (keep original values with %)
      const csvDataArray = lines.map(line => {
        const csvRow = {
          Timestamp: '',
          Near: '',
          Medium: '',
          Far: '',
          Battery: '',
          BeaconID: '1'
        };

        const firstComma = line.indexOf(',');
        if (firstComma > 0) {
          csvRow.Timestamp = line.substring(0, firstComma).trim();
        }

        const remaining = line.substring(firstComma + 1);
        remaining.split(',').forEach(pair => {
          const [key, value] = pair.split(':').map(item => item.trim());
          if (key && value && csvRow.hasOwnProperty(key)) {
            csvRow[key] = value; // Keep original with %
          }
        });
        
        return csvRow;
      });

      // Insert cleaned data to Supabase
      const { error } = await supabase.from('sensor_data_duplicate').insert(supabaseData);
      if (error) {
        console.error('Supabase insert error:', error.message);
        return NextResponse.json(
          { message: 'Error saving to Supabase', error: error.message },
          { status: 500 }
        );
      }

      // Generate CSV with original percentage values
      csvData = stringify(csvDataArray, {
        header: true,
        columns: headers
      });
    } else {
      csvData = content;
    }

    // Save file
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    await fsPromises.mkdir(uploadDir, { recursive: true });
    await fsPromises.writeFile(path.join(uploadDir, outputFileName), csvData);

    return NextResponse.json({ 
      message: 'File processed successfully',
      filename: outputFileName,
      path: `/uploads/${outputFileName}`
    });

  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { message: 'Error processing file', error: error.message },
      { status: 500 }
    );
  }
}