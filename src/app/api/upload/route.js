import { NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
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
    const userId = formData.get('userId');

    if (!file || !userId) {
      return NextResponse.json(
        { message: 'File and user ID are required' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const content = Buffer.from(buffer).toString('utf-8');

    // Parse CSV
    const rawRecords = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });

    console.log(`Total raw records: ${rawRecords.length}`);

    // Process records with proper error handling
    const records = [];
    for (const row of rawRecords) {
      try {
        const timestampRaw = row['Timestamp'] || row['timestamp'];
        if (!timestampRaw) {
          console.warn('Skipping row with missing timestamp:', row);
          continue;
        }

        // Parse timestamp
        let timestamp;
        try {
          timestamp = new Date(timestampRaw);
          if (isNaN(timestamp.getTime())) {
            // Try alternative formats if standard parsing fails
            const dateParts = timestampRaw.split(/[- :T/]/);
            if (dateParts.length >= 3) {
              // Try different date formats (YYYY-MM-DD, MM/DD/YYYY, etc.)
              timestamp = new Date(
                dateParts[0], // year
                dateParts[1] - 1, // month (0-indexed)
                dateParts[2] // day
              );
              // If time parts exist, add them
              if (dateParts.length > 3) {
                timestamp.setHours(
                  dateParts[3] || 0,
                  dateParts[4] || 0,
                  dateParts[5] || 0
                );
              }
            }
            
            if (isNaN(timestamp.getTime())) {
              console.warn(`Failed to parse timestamp: ${timestampRaw}`);
              continue;
            }
          }
        } catch (e) {
          console.warn(`Error parsing timestamp: ${timestampRaw}`, e);
          continue;
        }

        const iso = timestamp.toISOString();

        // Parse numeric values
        const near = parseInt(row['Near'] || row['near'] || '0');
        const medium = parseInt(row['Medium'] || row['medium'] || '0');
        const far = parseInt(row['Far'] || row['far'] || '0');
        const batteryRaw = row['Battery'] || row['battery'] || '0';
        const battery = parseFloat(batteryRaw.toString().replace('%', ''));

        records.push({
          timestamp: iso,
          near: isNaN(near) ? 0 : near,
          medium: isNaN(medium) ? 0 : medium,
          far: isNaN(far) ? 0 : far,
          battery: isNaN(battery) ? 0 : battery,
        });
      } catch (parseError) {
        console.error('Error processing row:', parseError, row);
      }
    }

    console.log(`Processed valid records: ${records.length}`);

    if (records.length === 0) {
      return NextResponse.json(
        { message: 'No valid records found in CSV file' },
        { status: 400 }
      );
    }

    // NEW IMPROVED GROUPING LOGIC
    // 1. First extract all unique dates in the records
    const uniqueDates = [...new Set(
      records.map(record => record.timestamp.split('T')[0])
    )];
    
    // 2. Sort dates chronologically
    uniqueDates.sort((a, b) => new Date(a) - new Date(b));
    
    // 3. Create dayData object with proper sequence
    const dayData = {};
    uniqueDates.forEach((date, index) => {
      const dayId = `day${index + 1}`;
      // Filter records for this specific date
      const dateRecords = records.filter(
        record => record.timestamp.split('T')[0] === date
      );
      
      dayData[dayId] = {
        id: dayId,
        date,
        measurements: dateRecords, // All records for this date
      };
    });

    // Insert into Supabase
    const { data, error } = await supabase
      .from('user_uploads')
      .insert({
        user_id: userId,
        original_filename: file.name,
        day_data: dayData,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ message: 'Database error', error }, { status: 500 });
    }

    console.log(`Successfully saved ${records.length} records, grouped into ${Object.keys(dayData).length} days`);

    return NextResponse.json({
      message: `File uploaded and processed successfully. Processed ${records.length} records.`,
      days: Object.values(dayData).map(day => ({
        id: day.id,
        label: `Day ${day.id.replace('day', '')}`,
        date: day.date,
        count: day.measurements.length,
      })),
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { message: 'Internal server error', error: err.message },
      { status: 500 }
    );
  }
}