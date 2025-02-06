import { generateRegistrationOptions } from '@simplewebauthn/server';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to convert string to Uint8Array
function stringToBuffer(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// You'll need to implement these based on your database setup
const getUserFromDB = async (username: string) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return null;
};

const createUser = async (username: string) => {
  // TODO: Create user in your database
  return {
    id: crypto.randomUUID(), // Generate a unique ID
    username
  };
};

// Get the domain from the request
function getDomain(req: NextRequest) {
  // For development
  if (process.env.NODE_ENV === 'development') {
    return 'localhost';
  }
  
  // For production
  const host = req.headers.get('host') || 'localhost';
  return host.split(':')[0]; // Remove port if present
}

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

    const domain = getDomain(req);
    const origin = process.env.NODE_ENV === 'development' 
      ? `http://${domain}:3000`
      : `https://${domain}`;

    // Check if user already exists
    const existingUser = await getUserFromDB(username);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Create new user
    const user = await createUser(username);

    // Generate registration options
    const options = await generateRegistrationOptions({
      rpName: 'WebAuthn Demo',
      rpID: domain,
      userID: stringToBuffer(user.id),
      userName: username,
      authenticatorSelection: {
        // 'platform' will prefer built-in authenticators (like Touch ID, Face ID, or Windows Hello)
        // 'cross-platform' will prefer external authenticators (like YubiKeys)
        // undefined will allow any authenticator type
        authenticatorAttachment: undefined,
        // This helps ensure the authenticator will work on mobile
        requireResidentKey: false,
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      // Most common algorithms supported across devices
      supportedAlgorithmIDs: [-7, -257], // ES256 & RS256
      timeout: 120000, // 2 minutes (longer timeout for mobile)
      attestationType: 'none',
    });

    // Store the challenge for later verification
    // await saveRegistrationChallenge(user.id, options.challenge);

    return NextResponse.json({
      ...options,
      debug: {
        rpID: domain,
        origin,
        userAgent: req.headers.get('user-agent'),
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

