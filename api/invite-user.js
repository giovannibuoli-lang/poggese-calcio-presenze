// API endpoint per invitare/reinvitare utenti su Clerk
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

    // PASSO 1: Verifica se l'utente esiste già
    const searchResponse = await fetch(
      `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }
    );

    const existingUsers = await searchResponse.json();

    // PASSO 2: Se esiste, reinvia invito
    if (existingUsers.length > 0) {
      const userId = existingUsers[0].id;
      
      // Reinvia email di invito
      const resendResponse = await fetch(
        `https://api.clerk.com/v1/invitations/${userId}/revoke`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
        }
      );

      // Crea nuovo invito
      const inviteResponse = await fetch('https://api.clerk.com/v1/invitations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: email,
          notify: true,
        }),
      });

      if (!inviteResponse.ok) {
        const errorData = await inviteResponse.json();
        return res.status(500).json({ 
          error: 'Errore nel reinvio invito',
          details: errorData 
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Invito reinviato con successo!',
        userExists: true
      });
    }

    // PASSO 3: Se non esiste, crea nuovo utente
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

    if (!createResponse.ok) {
      return res.status(createResponse.status).json({ 
        error: 'Errore nella creazione utente',
        details: createData 
      });
    }

    return res.status(200).json({
      success: true,
      clerkUserId: createData.id,
      message: 'Utente creato e invito inviato!',
      userExists: false
    });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      error: 'Errore interno del server',
      details: error.message 
    });
  }
}