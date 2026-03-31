import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import {
  generateNonce,
  generateRandomness,
  getZkLoginSignature,
  computeZkLoginAddress,
} from "@mysten/sui/zklogin";
import { getSuiClient } from "./sui";
import { GOOGLE_CLIENT_ID, REDIRECT_URL, PROVER_URL, SUI_NETWORK } from "./constants";

// ============================================================
// zkLogin Flow:
// 1. Generate ephemeral keypair + nonce
// 2. Redirect to Google OAuth
// 3. Receive JWT on callback
// 4. Derive Sui address from JWT + salt
// 5. Get ZK proof from prover
// 6. Sign transactions with ephemeral key + ZK proof
// ============================================================

const STORAGE_KEYS = {
  EPHEMERAL_KEY: "spice_ephemeral_key",
  RANDOMNESS: "spice_randomness",
  MAX_EPOCH: "spice_max_epoch",
  JWT: "spice_jwt",
  SALT: "spice_salt",
  ADDRESS: "spice_address",
  ZK_PROOF: "spice_zk_proof",
  USER_PROFILE: "spice_user_profile",
};

async function fetchSaltFromShinami(jwt) {
  const response = await fetch("/api/salt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jwt }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to get salt");
  }

  const data = await response.json();
  return { salt: data.salt, address: data.address };
}

// Step 1: Start the login flow — redirect to Google
export async function startLogin() {
  const client = getSuiClient();

  // Get current epoch for nonce
  const { epoch } = await client.getLatestSuiSystemState();
  const maxEpoch = Number(epoch) + 10; // Valid for ~10 epochs

  // Generate ephemeral keypair (temporary, stored in browser)
  const ephemeralKey = new Ed25519Keypair();
  const randomness = generateRandomness();

  // Generate nonce from ephemeral public key
  const nonce = generateNonce(ephemeralKey.getPublicKey(), maxEpoch, randomness);

  // Store in sessionStorage (cleared when browser closes)
  sessionStorage.setItem(STORAGE_KEYS.EPHEMERAL_KEY, ephemeralKey.getSecretKey());
  sessionStorage.setItem(STORAGE_KEYS.RANDOMNESS, randomness.toString());
  sessionStorage.setItem(STORAGE_KEYS.MAX_EPOCH, maxEpoch.toString());

  // Build Google OAuth URL
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URL,
    response_type: "id_token",
    scope: "openid email profile",
    nonce: nonce,
  });

  // Redirect to Google login
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// Step 2: Handle the OAuth callback — extract JWT and derive address
export async function handleCallback() {
  // Extract JWT from URL hash fragment
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const jwt = params.get("id_token");

  if (!jwt) {
    throw new Error("No id_token found in callback URL");
  }

  // Decode JWT to get user info (manual decode — no library needed)
  const payload = JSON.parse(atob(jwt.split(".")[1]));

  const { salt, address } = await fetchSaltFromShinami(jwt);

  // Store everything
  sessionStorage.setItem(STORAGE_KEYS.JWT, jwt);
  sessionStorage.setItem(STORAGE_KEYS.SALT, salt);
  sessionStorage.setItem(STORAGE_KEYS.ADDRESS, address);
  sessionStorage.setItem(
    STORAGE_KEYS.USER_PROFILE,
    JSON.stringify({
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    }),
  );

  // Get ZK proof from prover (this verifies the JWT without exposing identity on-chain)
  await fetchZkProof(jwt, salt);

  return {
    address,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
}

// Step 3: Fetch ZK proof from the prover service
async function fetchZkProof(jwt, salt) {
  const secretKey = sessionStorage.getItem(STORAGE_KEYS.EPHEMERAL_KEY)
  const ephemeralKey = Ed25519Keypair.fromSecretKey(secretKey)
  const randomness = sessionStorage.getItem(STORAGE_KEYS.RANDOMNESS)
  const maxEpoch = sessionStorage.getItem(STORAGE_KEYS.MAX_EPOCH)

  const response = await fetch('/api/zkproof', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jwt,
      maxEpoch: maxEpoch,
      ephemeralPublicKey: ephemeralKey.getPublicKey().toBase64(),
      jwtRandomness: randomness,
      salt: salt,
    }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Failed to get ZK proof')
  }

  const proof = await response.json()
  sessionStorage.setItem(STORAGE_KEYS.ZK_PROOF, JSON.stringify(proof))
  return proof
}

// Get the current session (if logged in)
export function getSession() {
  const address = sessionStorage.getItem(STORAGE_KEYS.ADDRESS);
  const profile = sessionStorage.getItem(STORAGE_KEYS.USER_PROFILE);

  if (!address || !profile) return null;

  return {
    address,
    ...JSON.parse(profile),
  };
}

// Get the ephemeral keypair for signing transactions
export function getEphemeralKeypair() {
  const secretKey = sessionStorage.getItem(STORAGE_KEYS.EPHEMERAL_KEY);
  if (!secretKey) return null;

  return Ed25519Keypair.fromSecretKey(secretKey);
}

// Get the ZK proof for transaction signing
export function getZkProof() {
  const data = sessionStorage.getItem(STORAGE_KEYS.ZK_PROOF);
  return data ? JSON.parse(data) : null;
}

// Get max epoch
export function getMaxEpoch() {
  return Number(sessionStorage.getItem(STORAGE_KEYS.MAX_EPOCH) || 0);
}

// Get salt
export function getSalt() {
  return sessionStorage.getItem(STORAGE_KEYS.SALT);
}

// Sign out — clear all session data
export function signOut() {
  Object.values(STORAGE_KEYS).forEach((key) => {
    sessionStorage.removeItem(key);
  });
}

// Check if the session is still valid (epoch not expired)
export async function isSessionValid() {
  const session = getSession();
  if (!session) return false;

  const maxEpoch = getMaxEpoch();
  if (!maxEpoch) return false;

  try {
    const client = getSuiClient();
    const { epoch } = await client.getLatestSuiSystemState();
    return Number(epoch) < maxEpoch;
  } catch {
    return false;
  }
}
