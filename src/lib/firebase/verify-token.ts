import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";

// Verificación del ID token de Firebase con una librería JWT, como documenta Firebase
// ("Verify ID tokens using a third-party JWT library"). Reemplaza a firebase-admin/auth,
// cuya dependencia jwks-rsa hace require() de un módulo ESM y falla en Vercel.

const GOOGLE_KEYS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

/** Devuelve el uid del usuario si el token es válido; si no, lanza un error. */
export async function verifyFirebaseIdToken(token: string, projectId: string): Promise<string> {
  const { payload } = await jwtVerify(token, GOOGLE_KEYS, {
    algorithms: ["RS256"],
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  if (!payload.sub) throw new Error("Token sin uid");
  return payload.sub;
}
