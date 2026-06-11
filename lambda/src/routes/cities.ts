import type { RouteHandler } from '../types'
import { getDb } from '../db'
import { ok, notFound, badRequest } from '../response'

/** GET /cities — full name list for autocomplete */
export const listCities: RouteHandler = async ({ origin }) => {
  const db   = await getDb()
  const docs = await db
    .collection('city')
    .find({}, { projection: { 'properties.name': 1, _id: 0 } })
    .sort({ 'properties.name': 1 })
    .toArray()
  return ok(docs.map(d => d.properties.name), origin)
}

/** GET /cities/:name — full city document */
export const getCity: RouteHandler = async ({ params, origin }) => {
  const db   = await getDb()
  const city = await db.collection('city').findOne(
    { 'properties.name': params.name },
    { projection: { _id: 0 }, collation: { locale: 'en', strength: 2 } },
  )
  if (!city) return notFound(`No city found with name "${params.name}"`, origin)
  return ok(city, origin)
}

/** GET /searches/top?limit=100 — most-searched cities, sorted by timesSearched desc */
export const getTopSearched: RouteHandler = async ({ query, origin }) => {
  const limit = Math.min(Number(query.limit ?? 100), 500)
  const db    = await getDb()
  const docs  = await db
    .collection('city')
    .find({}, { projection: { 'properties.name': 1, timesSearched: 1, _id: 0 } })
    .sort({ timesSearched: -1 })
    .limit(limit)
    .toArray()
  return ok(docs.map(d => ({ name: d.properties.name, timesSearched: d.timesSearched })), origin)
}

/** GET /searches/recent?limit=10 — most recently searched cities, sorted by lastSearched desc */
export const getRecentSearched: RouteHandler = async ({ query, origin }) => {
  const limit = Math.min(Number(query.limit ?? 10), 50)
  const db    = await getDb()
  const docs  = await db
    .collection('city')
    .find(
      { lastSearched: { $exists: true, $ne: null } },
      { projection: { 'properties.name': 1, lastSearched: 1, _id: 0 } },
    )
    .sort({ lastSearched: -1 })
    .limit(limit)
    .toArray()
  return ok(docs.map(d => ({ name: d.properties.name, lastSearched: d.lastSearched })), origin)
}

/** POST /cities/:name/search — increment timesSearched and stamp lastSearched */
export const recordSearch: RouteHandler = async ({ params, origin }) => {
  if (!params.name) return badRequest('City name is required', origin)
  const db     = await getDb()
  const result = await db.collection('city').findOneAndUpdate(
    { 'properties.name': params.name },
    {
      $inc: { timesSearched: 1 },
      $set: { lastSearched: new Date().toISOString() },
    },
    { returnDocument: 'after', projection: { 'properties.name': 1, timesSearched: 1, _id: 0 }, collation: { locale: 'en', strength: 2 } },
  )
  if (!result) return notFound(`No city found with name "${params.name}"`, origin)
  return ok({ name: result.properties.name, timesSearched: result.timesSearched }, origin)
}
