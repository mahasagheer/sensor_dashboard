import { NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import supabase from '@/lib/supabase';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to clean CSV content
const cleanCSVContent = (content) => {
  return content
    // Fix line breaks inside quoted fields
    .replace(/"[^"]*(?:\n[^"]*)*"/g, match => match.replace(/\n/g, ' '))
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove empty lines
    .split('\n')
    .filter(line => line.trim().length > 0)
    .join('\n');
};

// Improved number parser that preserves original values
const safeParseNumber = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    console.warn(`Missing ${fieldName} value, defaulting to 0`);
    return 0;
  }
  
  // For battery percentage (remove % but keep decimal)
  if (fieldName === 'Battery') {
    const num = parseFloat(String(value).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  }
  
  // For near/medium/far - strict integer parsing
  const num = parseInt(String(value).replace(/[^0-9-]/g, ''), 10);
  return isNaN(num) ? 0 : num;
};

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const userId = formData.get('userId');

    if (!file || !userId) {
      return NextResponse.json(
        { message: 'File and user ID are required' },
        { status: 400 }
      );
    }

    // Read and clean file content
    const buffer = await file.arrayBuffer();
    let content = Buffer.from(buffer).toString('utf-8');
    content = cleanCSVContent(content);

    console.log('[DEBUG] Cleaned content length:', content.length);
    console.log('[DEBUG] First 200 chars:', content.slice(0, 200));
    console.log('[DEBUG] Last 200 chars:', content.slice(-200));

    // Parse CSV with error-tolerant settings
    const rawRecords = parse(content, {
      columns: (header) => header.map(col => col.trim()), // Clean headers
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
      bom: true,
      on_record: (record, { lines, error }) => {
        if (error) {
          console.warn(`[PARSE WARNING] Line ${lines}: ${error.message}`);
          // Attempt to salvage partial data
          const parts = String(record).split(',');
          return {
            Timestamp: parts[0] || null,
            Near: safeParseNumber(parts[1], 'Near'),
            Medium: safeParseNumber(parts[2], 'Medium'),
            Far: safeParseNumber(parts[3], 'Far'),
            Battery: safeParseNumber(parts[4], 'Battery'),
            __error: error.message
          };
        }
        return record;
      }
    });

    console.log('[DEBUG] Raw records count:', rawRecords.length);
    console.log('[DEBUG] Sample record:', rawRecords[0]); // Log first record for verification

    // Process records with validation
    const records = [];
    const skipReasons = {
      invalidTimestamp: 0,
      invalidData: 0
    };

    for (const [index, row] of rawRecords.entries()) {
      try {
        // Normalize field names (case-insensitive)
        const fields = {};
        Object.keys(row).forEach(key => {
          fields[key.toLowerCase()] = row[key];
        });

        const timestampRaw = fields.timestamp || fields.time || fields.date;
        const near = safeParseNumber(fields.near, 'Near');
        const medium = safeParseNumber(fields.medium, 'Medium');
        const far = safeParseNumber(fields.far, 'Far');
        const battery = safeParseNumber(fields.battery, 'Battery');

        // Validate timestamp
        let timestamp;
        try {
          timestamp = new Date(timestampRaw);
          if (isNaN(timestamp.getTime())) {
            // Try alternative formats
            timestamp = new Date(timestampRaw.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1/$2/$3'));
            if (isNaN(timestamp.getTime())) {
              throw new Error('Invalid date format');
            }
          }
        } catch (e) {
          console.warn(`[VALIDATION] Row ${index + 1}: Invalid timestamp "${timestampRaw}"`);
          skipReasons.invalidTimestamp++;
          continue;
        }

        records.push({
          timestamp: timestamp.toISOString(),
          near,
          medium,
          far,
          battery,
          originalRow: index + 1
        });
      } catch (e) {
        console.warn(`[VALIDATION] Row ${index + 1}: Invalid data -`, e.message);
        skipReasons.invalidData++;
      }
    }

    console.log('[DEBUG] Valid records count:', records.length);
    console.log('[DEBUG] Skip reasons:', skipReasons);
    console.log('[DEBUG] Sample processed record:', records[0]); // Verify values

    if (records.length === 0) {
      return NextResponse.json(
        { message: 'No valid records found in CSV file' },
        { status: 400 }
      );
    }

    // Group by day
    const uniqueDates = [...new Set(
      records.map(record => record.timestamp.split('T')[0])
    )].sort((a, b) => new Date(a) - new Date(b));

    const dayData = {};
    uniqueDates.forEach((date, index) => {
      const dayId = `day${index + 1}`;
      dayData[dayId] = {
        id: dayId,
        date,
        measurements: records.filter(
          record => record.timestamp.split('T')[0] === date
        ),
      };
    });

    // Save to Supabase
    const { data, error } = await supabase
      .from('user_uploads')
      .insert({
        user_id: userId,
        original_filename: file.name,
        day_data: dayData
      })
      .select()
      .single();

    if (error) {
      console.error('[SUPABASE ERROR]', error);
      return NextResponse.json(
        { message: 'Database error', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Processed ${records.length}/${rawRecords.length} records successfully`,
      stats: {
        totalRecords: rawRecords.length,
        processedRecords: records.length,
        skipReasons,
      },
      days: Object.values(dayData).map(day => ({
        id: day.id,
        label: `Day ${day.id.replace('day', '')}`,
        date: day.date,
        count: day.measurements.length,
      })),
    });

  } catch (err) {
    console.error('[UNHANDLED ERROR]', err);
    return NextResponse.json(
      { message: 'Internal server error', error: err.message },
      { status: 500 }
    );
  }
}