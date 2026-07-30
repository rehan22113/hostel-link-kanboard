import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

// Cache the client across hot-reloads in dev and across route invocations in
// production, so we don't open a new connection pool on every request.
let cached = globalThis.__kanbanMongo;
if (!cached) {
  cached = globalThis.__kanbanMongo = { client: null, promise: null };
}

async function getClient() {
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env (see .env.example)."
    );
  }
  if (cached.client) return cached.client;
  if (!cached.promise) {
    cached.promise = new MongoClient(uri).connect();
  }
  cached.client = await cached.promise;
  return cached.client;
}

/**
 * Returns the default database from the connection string.
 * Make sure MONGODB_URI includes a database name in its path.
 */
export async function getDb() {
  const client = await getClient();
  return client.db();
}

/** Shortcut to the tasks collection. */
export async function getTasks() {
  const db = await getDb();
  return db.collection("tasks");
}
