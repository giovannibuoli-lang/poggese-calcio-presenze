// API endpoint per invitare utenti su Clerk
export default async function handler(req, res) {
  // Solo metodo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, firstName, lastName } = req.body;

    // Validazione input
    if (!email || !firstName || !lastName) {
      return res.status(400).json({ 
        error: 'Email, firstName e lastName sono obbligatori' 
      });
    }

    // Chiama API Clerk per creare l'utente
    const clerkResponse = await fetch('https://api.clerk.com/v1/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: [email],
        first_name: firstName,
        last_name: lastName,
        skip_password_checks: true,
        skip_password_requirement: true,
        notify: true, // Invia email di invito automaticamente
      }),
    });

    const clerkData = await clerkResponse.json();

    // Gestione errori Clerk
    if (!clerkResponse.ok) {
      console.error('Clerk API Error:', clerkData);
      
      // Se l'utente esiste già
      if (clerkData.errors?.[0]?.code === 'form_identifier_exists') {
        return res.status(409).json({ 
          error: 'Utente già esistente',
          message: 'Questo indirizzo email è già registrato su Clerk'
        });
      }

      return res.status(clerkResponse.status).json({ 
        error: 'Errore nella creazione utente Clerk',
        details: clerkData 
      });
    }

    // Successo!
    return res.status(200).json({
      success: true,
      clerkUserId: clerkData.id,
      message: 'Utente creato e invito inviato con successo!'
    });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      error: 'Errore interno del server',
      details: error.message 
    });
  }
}