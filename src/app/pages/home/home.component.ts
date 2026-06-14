import { Component, inject, signal, OnInit } from '@angular/core'
import { RouterLink, Router } from '@angular/router'
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component'
import { ThemeService } from '../../services/theme.service'
import { getCityNames, getSample, getTopSearched, getRecentSearched } from '../../../api/cities'
import type { SearchedCity, RecentCity, SampleCity } from '../../../api/cities'

// Texas geographic bounds — adjust if the map image has different framing
const TX = { north: 36.5, south: 25.84, west: -106.65, east: -93.51 }

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NavBarComponent],
  templateUrl: './home.component.html',
  styles: [`
    .hero { display:grid; grid-template-columns:minmax(0,1.05fr) minmax(0,0.95fr); gap:var(--s9); align-items:center; padding:clamp(32px,6vw,80px) 0; }
    .hero-copy { max-width:540px; }
    .map-stage { position:relative; display:grid; place-items:center; min-height:360px; }
    .map-blob  { position:absolute; width:78%; aspect-ratio:1; border-radius:50%; background:var(--map-bg); filter:blur(2px); }
    .map-img.hero-map { position:relative; width:min(420px,80%); aspect-ratio:1; }
    .lists { display:grid; grid-template-columns:1fr 1fr; gap:var(--s7); margin-top:var(--s7); margin-bottom:var(--s7); }
    .map-wrap { position:relative; width:min(420px,80%); aspect-ratio:1; }
    .map-wrap img { width:100%; aspect-ratio:1; display:block; }
    .map-tags { position:absolute; inset:0; pointer-events:none; }
    .map-tags .tag { position:absolute; display:inline-flex; align-items:center; gap:8px; background:var(--surface); border:1px solid var(--border); box-shadow:var(--shadow-md); border-radius:var(--r-pill); padding:7px 13px 7px 10px; font-size:12.5px; font-weight:600; pointer-events:all; transition:border-color var(--ease),box-shadow var(--ease),transform var(--ease); white-space:nowrap; transform:translate(-50%,-50%); }
    .map-tags .tag:hover { border-color:var(--accent); box-shadow:var(--shadow-lg); transform:translate(-50%,-54%); }
    .map-tags .tag .pindot { width:8px; height:8px; border-radius:50%; background:var(--accent); flex:none; }
    @media (max-width:900px) {
      .hero { grid-template-columns:1fr; gap:var(--s6); padding:var(--s6) 0; }
      .map-stage { order:-1; min-height:240px; }
      .map-img.hero-map { width:230px; }
      .lists { gap:var(--s6); }
    }
    @media (max-width:520px) { .lists { grid-template-columns:1fr; } }
  `],
})
export class HomeComponent implements OnInit {
  private router = inject(Router)
  readonly themeService = inject(ThemeService)

  cityNames      = signal<string[] | null>(null)
  topSearched    = signal<SearchedCity[] | null>(null)
  recentSearched = signal<RecentCity[] | null>(null)
  sampleCities   = signal<SampleCity[]>([])

  ngOnInit(): void {
    getCityNames().then(n => this.cityNames.set(n)).catch(() => {})
    getTopSearched(5).then(t => this.topSearched.set(t)).catch(() => {})
    getRecentSearched(10).then(r => this.recentSearched.set(r)).catch(() => {})
    getSample().then(s => this.sampleCities.set(s)).catch(() => {})
  }

  mapPos(city: SampleCity): { top: number; left: number } {
    const lat = parseFloat(city.properties.intptlat)
    const lon = parseFloat(city.properties.intptlon)
    return {
      left: (lon - TX.west)  / (TX.east  - TX.west)  * 100,
      top:  (TX.north - lat) / (TX.north - TX.south) * 100,
    }
  }

  handleSearch(value: string, event: Event): void {
    event.preventDefault()
    const name = value.trim()
    if (!name) return
    this.router.navigate(['/city', name])
  }

  handleRandom(): void {
    const names = this.cityNames()
    if (names?.length) {
      const pick = names[Math.floor(Math.random() * names.length)]
      this.router.navigate(['/city', pick])
    }
  }

  timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)   return 'just now'
    if (m < 60)  return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24)  return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }
}
