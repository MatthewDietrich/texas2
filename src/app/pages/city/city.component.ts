import { Component, input, signal, effect, computed } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component'
import { FooterComponent } from '../../components/footer/footer.component'
import { getCity } from '../../../api/cities'
import { getCamerasForCity } from '../../../api/cameras'
import type { City } from '../../../api/cities'
import type { Camera } from '../../../api/cameras'

const CAMERA_PLACEHOLDERS = Array.from({ length: 8 }, (_, i) => i)

const HOURLY = Array.from({ length: 12 }, (_, i) => ({ hour: `${(8 + i) % 24}:00` }))

const FORECAST = [
  { day: 'Mon' }, { day: 'Tue' }, { day: 'Wed' }, { day: 'Thu' },
  { day: 'Fri' }, { day: 'Sat' }, { day: 'Sun' },
]

const ALMANAC_ROWS = [
  'Condition', 'High', 'Low', 'Total Precip.', 'Avg. Humidity',
  'Avg. Cloud Cover', 'Avg. Wind', 'Pressure', 'Sunrise', 'Sunset',
]

@Component({
  selector: 'app-city',
  standalone: true,
  imports: [RouterLink, NavBarComponent, FooterComponent],
  templateUrl: './city.component.html',
})
export class CityComponent {
  readonly cityName = input.required<string>()

  city        = signal<City | null>(null)
  cityLoading = signal(true)
  cityError   = signal<string | null>(null)
  cameras     = signal<Camera[] | null>(null)
  camsLoading = signal(true)
  camsError   = signal<string | null>(null)

  readonly cameraPlaceholders = CAMERA_PLACEHOLDERS
  readonly hourly             = HOURLY
  readonly forecast    = FORECAST
  readonly almanacRows = ALMANAC_ROWS

  readonly lat = computed(() => {
    const c = this.city()
    return c ? parseFloat(c.properties.intptlat).toFixed(7) : ''
  })
  readonly lon = computed(() => {
    const c = this.city()
    return c ? Math.abs(parseFloat(c.properties.intptlon)).toFixed(7) : ''
  })

  constructor() {
    effect(() => {
      const name = this.cityName()
      this.loadCity(name)
      this.loadCameras(name)
    })
  }

  private async loadCity(name: string): Promise<void> {
    this.cityLoading.set(true)
    this.cityError.set(null)
    try {
      this.city.set(await getCity(name))
    } catch (err) {
      this.cityError.set(err instanceof Error ? err.message : 'Request failed')
    } finally {
      this.cityLoading.set(false)
    }
  }

  private async loadCameras(name: string): Promise<void> {
    this.camsLoading.set(true)
    this.camsError.set(null)
    try {
      this.cameras.set(await getCamerasForCity(name))
    } catch (err) {
      this.camsError.set(err instanceof Error ? err.message : 'Request failed')
    } finally {
      this.camsLoading.set(false)
    }
  }
}
