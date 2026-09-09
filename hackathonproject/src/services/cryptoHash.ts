/**
 * Exact cryptographic hashing service using Web Crypto API.
 * Computes SHA-256 hash of an image file or blob without sending data to a server.
 */

export async function computeSHA256(blobOrFile: Blob | File): Promise<string> {
  const buffer = await blobOrFile.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexString = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hexString;
}
