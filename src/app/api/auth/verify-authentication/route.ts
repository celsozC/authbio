import { verifyAuthenticationResponse } from '@simplewebauthn/server';
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

const getStoredChallengeForUser = async (userId: string) => {
  // TODO: Retrieve the challenge you stored during authentication options generation
  return 'stored-challenge';
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, authResult } = body;

    if (!username || !authResult) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    const expectedChallenge = await getStoredChallengeForUser(user.id);

    let verification;
    try {
      const device = user.devices.find(
        d => d.credentialID.equals(authResult.id)
      );

      if (!device) {
        throw new Error('Authenticator is not registered with this user');
      }

      verification = await verifyAuthenticationResponse({
        response: authResult,
        expectedChallenge,
        expectedOrigin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000',
        expectedRPID: process.env.WEBAUTHN_RP_ID || 'localhost',
        authenticator: {
          credentialPublicKey: device.credentialPublicKey,
          credentialID: device.credentialID,
          counter: device.counter,
        },
      });
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        { error: 'Authentication verification failed' },
        { status: 400 }
      );
    }

    if (verification.verified) {
      // Update the authenticator's counter in the database
      // await updateAuthenticatorCounter(device.id, verification.authenticationInfo.newCounter);

      // Create session or JWT token here
      return NextResponse.json({ 
        verified: true,
        message: 'Authentication successful' 
      });
    }

    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 400 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
