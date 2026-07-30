// Convert a MongoDB task document into a plain JSON-safe object for the client.
export function toClient(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}
