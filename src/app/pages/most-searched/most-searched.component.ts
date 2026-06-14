import { Component, signal, computed, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component'
import { FooterComponent } from '../../components/footer/footer.component'
import { getTopSearched } from '../../../api/cities'
import type { SearchedCity } from '../../../api/cities'

type SortKey = 'rank' | 'name' | 'count'
type SortDir = 'asc' | 'desc'

interface RankedCity { rank: number; name: string; count: number }

@Component({
  selector: 'app-most-searched',
  standalone: true,
  imports: [RouterLink, NavBarComponent, FooterComponent],
  templateUrl: './most-searched.component.html',
  styles: [`
    .lb-wrap { max-width:860px; margin:0 auto; padding:var(--s7) 0 var(--s8); }
    .lb-head { display:flex; align-items:flex-end; justify-content:space-between; gap:var(--s4); flex-wrap:wrap; margin-bottom:var(--s6); }
    .lb-table-card { padding:var(--s2); }
    @media (max-width:600px) { .lb-hide { display:none; } }
  `],
})
export class MostSearchedComponent implements OnInit {
  cities  = signal<SearchedCity[] | null>(null)
  loading = signal(true)
  error   = signal<string | null>(null)
  sortKey = signal<SortKey>('rank')
  sortDir = signal<SortDir>('asc')

  readonly ranked = computed<RankedCity[]>(() =>
    (this.cities() ?? []).map((c, i) => ({ rank: i + 1, name: c.name, count: c.timesSearched }))
  )

  readonly sorted = computed<RankedCity[]>(() => {
    const key = this.sortKey(), dir = this.sortDir()
    return [...this.ranked()].sort((a, b) => {
      const av = a[key], bv = b[key]
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return dir === 'asc' ? cmp : -cmp
    })
  })

  readonly maxCount = computed(() => Math.max(...(this.cities() ?? []).map(c => c.timesSearched), 1))

  ngOnInit(): void {
    getTopSearched(100)
      .then(c => { this.cities.set(c); this.loading.set(false) })
      .catch(err => { this.error.set(err instanceof Error ? err.message : 'Request failed'); this.loading.set(false) })
  }

  handleSort(key: SortKey): void {
    if (key === this.sortKey()) this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc')
    else { this.sortKey.set(key); this.sortDir.set('asc') }
  }

  indicator(key: SortKey): string {
    return this.sortKey() === key ? (this.sortDir() === 'asc' ? ' ↑' : ' ↓') : ''
  }

  isMedal(rank: number): boolean { return rank <= 3 }
  rankLabel(rank: number): string { return String(rank).padStart(2, '0') }
  barWidth(count: number): number { return Math.round((count / this.maxCount()) * 100) }
}
