import { get, post } from './client'

export interface Camera {
  icdId:                string
  direction:            string
  location: {
    type:        'Point'
    coordinates: [number, number]  // [longitude, latitude]
  }
  hasSnapshot:          boolean
  districtAbbreviation: string
  timesViewed:          number
  lastViewed:           string | null
  snapshot?:            string  // base64 image — only on GET /cameras/:id
}

export const getCamerasForCity = (cityName: string) =>
  get<Camera[]>(`/cities/${encodeURIComponent(cityName)}/cameras`)

export const getCamera  = (id: string) => get<Camera>(`/cameras/${encodeURIComponent(id)}`)
export const recordView = (id: string) => post<{ icdId: string; timesViewed: number }>(`/cameras/${encodeURIComponent(id)}/view`)
