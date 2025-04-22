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

    // Parse and normalize CSV
    const rawRecords = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });

    const records = rawRecords
      .map((row) => {
        const timestampRaw = row['Timestamp'] || row['timestamp'];
        const timestamp = new Date(timestampRaw);
        if (isNaN(timestamp.getTime())) return null;

        const iso = timestamp.toISOString(); // Normalized ISO string

        return {
          timestamp: iso,
          near: parseInt(row['Near'] || row['near']) || 0,
          medium: parseInt(row['Medium'] || row['medium']) || 0,
          far: parseInt(row['Far'] || row['far']) || 0,
          battery: parseFloat((row['Battery'] || row['battery'] || '0').replace('%', '')) || 0,
        };
      })
      .filter(Boolean); // remove nulls

    if (records.length === 0) {
      return NextResponse.json(
        { message: 'No valid records found in CSV file' },
        { status: 400 }
      );
    }

    // Group by normalized date (UTC)
    const groupedByDate = {};
    for (const record of records) {
      const dateOnly = record.timestamp.split('T')[0]; // 'YYYY-MM-DD'
      if (!groupedByDate[dateOnly]) {
        groupedByDate[dateOnly] = [];
      }
      groupedByDate[dateOnly].push(record);
    }

    // Sort date keys and assign dayX
    const sortedDates = Object.keys(groupedByDate).sort();
    const dayData = {};
    sortedDates.forEach((date, index) => {
      const dayId = `day${index + 1}`;
      dayData[dayId] = {
        id: dayId,
        date,
        measurements: groupedByDate[date],
      };
    });

    // Save to Supabase
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

    return NextResponse.json({
      message: 'File uploaded and processed successfully',
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
