import { Component, inject, signal, OnInit } from '@angular/core'
import { RouterLink, Router } from '@angular/router'
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component'
import { ThemeService } from '../../services/theme.service'
import { getCityNames, getTopSearched, getRecentSearched, recordSearch } from '../../../api/cities'
import type { SearchedCity, RecentCity } from '../../../api/cities'

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

  ngOnInit(): void {
    getCityNames().then(n => this.cityNames.set(n)).catch(() => {})
    getTopSearched(5).then(t => this.topSearched.set(t)).catch(() => {})
    getRecentSearched(10).then(r => this.recentSearched.set(r)).catch(() => {})
  }

  handleSearch(value: string, event: Event): void {
    event.preventDefault()
    const name = value.trim()
    if (!name) return
    recordSearch(name).catch(() => {})
    this.router.navigate(['/city', name])
  }

  handleRandom(): void {
    const names = this.cityNames()
    if (names?.length) {
      const pick = names[Math.floor(Math.random() * names.length)]
      recordSearch(pick).catch(() => {})
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
