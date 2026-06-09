import type { RouteHandler } from '../types'
import { getDb } from '../db'
import { ok, notFound, badRequest } from '../response'

/** GET /cities — full name list for autocomplete */
export const listCities: RouteHandler = async ({ origin }) => {
  const db = await getDb()
  const names = await db
    .collection('cities')
    .find({}, { projection: { name: 1, _id: 0 } })
    .sort({ name: 1 })
    .toArray()
  return ok(names.map((d) => d.name), origin)
}

/** GET /cities/:name — full city document */
export const getCity: RouteHandler = async ({ params, origin }) => {
  const db = await getDb()
  const city = await db.collection('cities').findOne(
    { name: params.name },
    { projection: { _id: 0 } },
  )
  if (!city) return notFound(`No city found with name "${params.name}"`, origin)
  return ok(city, origin)
}

/** GET /searches/top?limit=100 — most-searched cities */
export const getTopSearched: RouteHandler = async ({ query, origin }) => {
  const limit = Math.min(Number(query.limit ?? 100), 500)
  const db = await getDb()
  const cities = await db
    .collection('cities')
    .find({}, { projection: { name: 1, searchCount: 1, _id: 0 } })
    .sort({ searchCount: -1 })
    .limit(limit)
    .toArray()
  return ok(cities, origin)
}

/** POST /cities/:name/search — increment searchCount and return updated count */
export const recordSearch: RouteHandler = async ({ params, origin }) => {
  if (!params.name) return badRequest('City name is required', origin)
  const db = await getDb()
  const result = await db.collection('cities').findOneAndUpdate(
    { name: params.name },
    { $inc: { searchCount: 1 } },
    { returnDocument: 'after', projection: { name: 1, searchCount: 1, _id: 0 } },
  )
  if (!result) return notFound(`No city found with name "${params.name}"`, origin)
  return ok(result, origin)
}
