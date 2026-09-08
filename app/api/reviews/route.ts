import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurant_id = searchParams.get('restaurant_id');

    if (!restaurant_id) {
      return NextResponse.json({ error: 'Missing restaurant_id parameter' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('reviews')
      .select('id, restaurant_id, rating, comment, user_name, image_url, created_at')
      .eq('restaurant_id', restaurant_id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { restaurant_id, rating, comment, user_name, image_url } = body;

    const { data, error } = await supabase
      .from('reviews')
      .insert([
        { 
          restaurant_id, 
          rating, 
          comment, 
          user_name: user_name || 'Anonymous Student',
          image_url: image_url || null
        }
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}