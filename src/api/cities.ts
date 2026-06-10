import { get, post } from './client'

export interface City {
  name:        string
  county:      string
  state:       string
  lat:         number
  lon:         number
  population:  number
  searchCount: number
  nearby:      string[]
}

export interface SearchedCity {
  name:        string
  searchCount: number
}

export const getCityNames   = ()                   => get<string[]>('/cities')
export const getCity        = (name: string)       => get<City>(`/cities/${encodeURIComponent(name)}`)
export const getTopSearched = (limit = 100)        => get<SearchedCity[]>(`/searches/top?limit=${limit}`)
export const recordSearch   = (name: string)       => post<{ name: string; searchCount: number }>(`/cities/${encodeURIComponent(name)}/search`)
