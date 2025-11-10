// liquiditaetstool-dashboard/src/app/api/forderungen/[id]/send-reminder/route.ts
// TODO: Email-Funktionalität mit Resend wird später implementiert

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Email-Funktionalität ist noch nicht implementiert
    return NextResponse.json(
      { 
        error: 'Email-Versand noch nicht implementiert',
        message: 'Diese Funktion wird in Kürze verfügbar sein. Resend-Integration folgt später.'
      },
      { status: 501 } // 501 = Not Implemented
    );

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper Functions für später (wenn Resend aktiviert wird)
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(numAmount);
}
