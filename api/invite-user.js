// API endpoint per invitare utenti su Clerk
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let { email, firstName, lastName } = req.body;

    // Valori di default
    firstName = firstName?.trim() || 'Giocatore';
    lastName = lastName?.trim() || 'Academy';

    if (!email) {
      return res.status(400).json({ error: 'Email è obbligatoria' });
    }

    // Prova a creare l'utente
    const createResponse = await fetch('https://api.clerk.com/v1/users', {
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
        notify: true,
      }),
    });

    const createData = await createResponse.json();

    // Se l'utente esiste già, lo consideriamo OK
    if (createResponse.status === 422 || createResponse.status === 409) {
      if (createData.errors?.some(e => e.code === 'form_identifier_exists')) {
        return res.status(200).json({
          success: true,
          message: 'Utente già registrato su Clerk',
          alreadyExists: true
        });
      }
    }

    // Altri errori
    if (!createResponse.ok) {
      console.error('Clerk API Error:', createData);
      return res.status(createResponse.status).json({ 
        error: 'Errore Clerk',
        details: createData 
      });
    }

    // Successo - utente creato
    return res.status(200).json({
      success: true,
      clerkUserId: createData.id,
      message: 'Utente creato e invito inviato!',
      alreadyExists: false
    });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      error: 'Errore server',
      details: error.message 
    });
  }
}