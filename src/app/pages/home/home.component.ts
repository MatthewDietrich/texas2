import { Component, inject, signal, OnInit } from '@angular/core'
import { RouterLink, Router } from '@angular/router'
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component'
import { getCityNames, getTopSearched, getRecentSearched, recordSearch } from '../../../api/cities'
import type { SearchedCity, RecentCity } from '../../../api/cities'

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NavBarComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  private router = inject(Router)

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
}
