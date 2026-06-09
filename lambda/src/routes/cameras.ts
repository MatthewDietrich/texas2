import type { RouteHandler } from '../types'
import { getDb } from '../db'
import { ok, notFound, badRequest } from '../response'

/** GET /cameras/:id — full camera document including snapshot */
export const getCamera: RouteHandler = async ({ params, origin }) => {
  const db = await getDb()
  const camera = await db.collection('cameras').findOne(
    { icdId: params.id },
    { projection: { _id: 0 } },
  )
  if (!camera) return notFound(`No camera found with id "${params.id}"`, origin)
  return ok(camera, origin)
}

/** GET /cities/:name/cameras — all cameras nearest to a city */
export const getCamerasForCity: RouteHandler = async ({ params, origin }) => {
  if (!params.name) return badRequest('City name is required', origin)
  const db = await getDb()
  const cameras = await db
    .collection('cameras')
    .find(
      { nearestCity: params.name },
      { projection: { _id: 0, snapshot: 0 } }, // omit heavy snapshot payload in list
    )
    .limit(8)
    .toArray()
  return ok(cameras, origin)
}

/** POST /cameras/:id/view — increment viewCount and return updated count */
export const recordView: RouteHandler = async ({ params, origin }) => {
  if (!params.id) return badRequest('Camera id is required', origin)
  const db = await getDb()
  const result = await db.collection('cameras').findOneAndUpdate(
    { icdId: params.id },
    { $inc: { viewCount: 1 } },
    { returnDocument: 'after', projection: { icdId: 1, viewCount: 1, _id: 0 } },
  )
  if (!result) return notFound(`No camera found with id "${params.id}"`, origin)
  return ok(result, origin)
}
