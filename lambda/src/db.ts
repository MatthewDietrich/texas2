import { MongoClient, Db } from 'mongodb'

let client: MongoClient | null = null

export async function getDb(): Promise<Db> {
  if (!client) {
    const uri = process.env.MONGODB_URI
    if (!uri) throw new Error('MONGODB_URI environment variable is not set')
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    })
    await client.connect()
  }
  return client.db(process.env.MONGODB_DB ?? 'texas')
}
