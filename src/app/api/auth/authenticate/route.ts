import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { NextRequest, NextResponse } from 'next/server';

// You'll need to implement these based on your database setup
const getUserFromDB = async (username: string) => {
  // TODO: Fetch user and their authenticator data from your database
  return {
    id: 'user-unique-id',
    username,
    devices: [] // Array of previously registered authenticators
  };
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const user = await getUserFromDB(username);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID: process.env.WEBAUTHN_RP_ID || 'localhost',
      allowCredentials: user.devices.map(device => ({
        id: device.credentialID,
        type: 'public-key',
        transports: device.transports,
      })),
      userVerification: 'preferred',
    });

    // Save the challenge in your database or session
    // await saveAuthenticationChallenge(user.id, options.challenge);

    return NextResponse.json(options);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
