// Importamos Supabase usando el registro NPM oficial (infalible)
import { createClient } from 'npm:@supabase/supabase-js@2'

// Usamos el servidor nativo de Deno (cero descargas necesarias)
Deno.serve(async (req: Request) => {
  // 1. Ignorar a los curiosos
  if (req.method !== 'POST') {
    return new Response('Método no permitido.', { status: 405 })
  }

  try {
    const eventType = req.headers.get('x-gogs-event') || 'unknown';
    const payloadText = await req.text();
    const payloadJson = JSON.parse(payloadText);

    // 2. Conectar al Núcleo de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Inyectar en la Bóveda
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

    // 4. Confirmación a Gogs
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