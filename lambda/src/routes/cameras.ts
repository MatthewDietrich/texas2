import type { RouteHandler } from '../types'
import { getDb } from '../db'
import { ok, notFound, badRequest } from '../response'
import { getCctvSnapshot } from '../txdot'

/** GET /cameras/:id — camera metadata + live snapshot from TxDOT */
export const getCamera: RouteHandler = async ({ params, origin }) => {
  const db     = await getDb()
  const camera = await db.collection('cameras').findOne(
    { icdId: params.id },
    { projection: { _id: 0 } },
  )
  if (!camera) return notFound(`No camera found with id "${params.id}"`, origin)

  let snapshot: string | null = null
  if (camera.hasSnapshot) {
    snapshot = await getCctvSnapshot(camera.icdId).catch(() => null)
  }

  return ok({ ...camera, snapshot }, origin)
}

/**
 * GET /cities/:name/cameras — cameras near a city using a geospatial $near query.
 *
 * Requires a 2dsphere index on the cameras collection:
 *   db.cameras.createIndex({ location: '2dsphere' })
 */
export const getCamerasForCity: RouteHandler = async ({ params, origin }) => {
  if (!params.name) return badRequest('City name is required', origin)

  const db   = await getDb()
  const city = await db.collection('city').findOne(
    { 'properties.name': params.name },
    { projection: { geometry: 1, _id: 0 }, collation: { locale: 'en', strength: 2 } },
  )
  if (!city) return notFound(`No city found with name "${params.name}"`, origin)

  // Use $geoWithin so we get cameras on roads that pass through the city boundary.
  // Requires a 2dsphere index on cameras.location:
  //   db.cameras.createIndex({ location: '2dsphere' })
  const cameras = await db.collection('cameras').find(
    { location: { $geoWithin: { $geometry: city.geometry } } },
    { projection: { _id: 0 } },
  )
    .limit(8)
    .toArray()

  return ok(cameras, origin)
}

/** POST /cameras/:id/view — increment timesViewed and stamp lastViewed */
export const recordView: RouteHandler = async ({ params, origin }) => {
  if (!params.id) return badRequest('Camera id is required', origin)

  const db     = await getDb()
  const result = await db.collection('cameras').findOneAndUpdate(
    { icdId: params.id },
    {
      $inc: { timesViewed: 1 },
      $set: { lastViewed: new Date().toISOString() },
    },
    { returnDocument: 'after', projection: { icdId: 1, timesViewed: 1, _id: 0 } },
  )
  if (!result) return notFound(`No camera found with id "${params.id}"`, origin)
  return ok(result, origin)
}
