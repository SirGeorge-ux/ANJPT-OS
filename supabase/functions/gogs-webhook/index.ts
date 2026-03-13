import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Método no permitido. Solo POST táctico.', { status: 405 })
  }

  try {
    const signature = req.headers.get('x-gogs-signature');
    const eventType = req.headers.get('x-gogs-event') || 'unknown';
    
    const payloadText = await req.text();
    const payloadJson = JSON.parse(payloadText);

    // Conectamos con el Núcleo de Supabase usando los permisos de "Dios" (Service Role)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Inyectamos el evento bruto en nuestra bóveda (gogs_events)
    const { error } = await supabase
      .from('gogs_events')
      .insert([
        {
          event_type: eventType,
          payload: payloadJson,
          processed: false
        }
      ]);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, message: 'Interceptado y asegurado en ANJPT OS' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err: any) {
    console.error('Error crítico en la antena:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})