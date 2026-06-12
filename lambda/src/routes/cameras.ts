import type { RouteHandler } from '../types'
import { getDb } from '../db'
import { ok, notFound, badRequest } from '../response'
import { getCctvSnapshot } from '../txdot'
import { Collections } from '../collections'

const NUM_CAMERAS = 8

/** GET /cameras/:id — camera metadata + live snapshot from TxDOT */
export const getCamera: RouteHandler = async ({ params, origin }) => {
  const db     = await getDb()
  const camera = await db.collection(Collections.camera).findOne(
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

const FIVE_MILES_METRES = 8047

/** GET /cities/:name/cameras — cameras within 5 miles of the city's internal point */
export const getCamerasForCity: RouteHandler = async ({ params, origin }) => {
  if (!params.name) return badRequest('City name is required', origin)

  const db   = await getDb()
  const city = await db.collection(Collections.city).findOne(
    { 'properties.name': params.name },
    {
      projection: { 'properties.intptlat': 1, 'properties.intptlon': 1, _id: 0 },
      collation:  { locale: 'en', strength: 2 },
    },
  )
  if (!city) return notFound(`No city found with name "${params.name}"`, origin)

  const lat = parseFloat(city.properties.intptlat)
  const lon = parseFloat(city.properties.intptlon)

  const cameras = await db.collection(Collections.camera).aggregate([
    {
      $geoNear: {
        near:          { type: 'Point', coordinates: [lon, lat] },
        distanceField: 'dist',
        maxDistance:   FIVE_MILES_METRES,
        spherical:     true,
      },
    },
    { $limit: NUM_CAMERAS },
    { $project: { _id: 0, dist: 0 } },
  ]).toArray()

  const snapshots = await Promise.all(
    cameras.map(cam => cam.hasSnapshot ? getCctvSnapshot(cam.icdId).catch(() => null) : null)
  )

  return ok(cameras.map((cam, i) => ({ ...cam, snapshot: snapshots[i] })), origin)
}

/** POST /cameras/:id/view — increment timesViewed and stamp lastViewed */
export const recordView: RouteHandler = async ({ params, origin }) => {
  if (!params.id) return badRequest('Camera id is required', origin)

  const db     = await getDb()
  const result = await db.collection(Collections.camera).findOneAndUpdate(
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
