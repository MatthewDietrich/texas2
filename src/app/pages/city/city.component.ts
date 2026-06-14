import { Component, input, signal, effect, computed } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component'
import { FooterComponent } from '../../components/footer/footer.component'
import { getCity } from '../../../api/cities'
import { getCamerasForCity } from '../../../api/cameras'
import type { City } from '../../../api/cities'
import type { Camera } from '../../../api/cameras'

type Tab = 'snap' | 'weather' | 'water' | 'trans'

const HOURLY = Array.from({ length: 10 }, (_, i) => ({
  hour: i === 0 ? 'Now' : `${(new Date().getHours() + i) % 24}:00`,
}))

const FORECAST = [
  { day: 'Today' }, { day: 'Sat' }, { day: 'Sun' },
  { day: 'Mon'   }, { day: 'Tue' }, { day: 'Wed' }, { day: 'Thu' },
]

const ALMANAC_ROWS = ['High', 'Low', 'Precip.']

const CAMERA_PLACEHOLDERS = Array.from({ length: 8 }, (_, i) => i)

@Component({
  selector: 'app-city',
  standalone: true,
  imports: [RouterLink, NavBarComponent, FooterComponent],
  templateUrl: './city.component.html',
  styles: [`
    .city-head { display:grid; grid-template-columns:1fr; gap:var(--s5); align-items:center; padding:var(--s7) 0 var(--s6); }
    .tabbar { display:flex; align-items:center; justify-content:space-between; gap:var(--s4); flex-wrap:wrap; margin-bottom:var(--s5); }
    .panels { padding-bottom:var(--s8); }
    .src-line { color:var(--text-subtle); font-size:13px; }
    .src-line a { color:var(--text-muted); text-decoration:underline; text-underline-offset:2px; }
    @media (max-width:760px) {
      .city-head { padding:var(--s6) 0 var(--s5); }
      .statrow { gap:var(--s5); }
      .segtabs { width:100%; overflow-x:auto; }
    }
  `],
})
export class CityComponent {
  readonly cityName = input.required<string>()

  city        = signal<City | null>(null)
  cityLoading = signal(true)
  cityError   = signal<string | null>(null)
  cameras     = signal<Camera[] | null>(null)
  camsLoading = signal(true)
  camsError   = signal<string | null>(null)

  activeTab = signal<Tab>('snap')

  readonly hourly           = HOURLY
  readonly forecast         = FORECAST
  readonly almanacRows      = ALMANAC_ROWS
  readonly cameraPlaceholders = CAMERA_PLACEHOLDERS

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
