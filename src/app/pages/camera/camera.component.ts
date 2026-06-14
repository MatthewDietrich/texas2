import { Component, input, signal, effect, computed } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component'
import { FooterComponent } from '../../components/footer/footer.component'
import { getCamera, recordView } from '../../../api/cameras'
import type { Camera } from '../../../api/cameras'

const DIRECTION: Record<string, string> = {
  NB: 'Northbound', SB: 'Southbound', EB: 'Eastbound', WB: 'Westbound',
}

@Component({
  selector: 'app-camera',
  standalone: true,
  imports: [RouterLink, NavBarComponent, FooterComponent],
  templateUrl: './camera.component.html',
  styles: [`
    .cam-wrap { max-width:920px; margin:0 auto; padding:var(--s7) 0 var(--s8); }
    .cam-head { display:flex; align-items:flex-end; justify-content:space-between; gap:var(--s5); flex-wrap:wrap; margin-bottom:var(--s5); }
    .cam-head .cid { font-family:var(--font-mono); font-size:clamp(30px,5vw,46px); font-weight:500; letter-spacing:-0.01em; }
    .cam-head .loc { color:var(--text-muted); font-size:16px; margin-top:4px; }
    .big-shot { position:relative; aspect-ratio:16/9; border-radius:var(--r-lg); overflow:hidden; border:1px solid var(--border); box-shadow:var(--shadow-md);
      background:repeating-linear-gradient(135deg,var(--surface-2) 0 16px,var(--surface-3) 16px 32px); display:grid; place-items:center; }
    .big-shot img { width:100%; height:100%; object-fit:cover; }
    .big-shot .ph { color:var(--text-subtle); font-family:var(--font-mono); font-size:14px; }
    .meta-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:var(--s4); margin-top:var(--s6); }
    .meta-card { padding:var(--s5); }
    .meta-card .k { font-size:11.5px; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; color:var(--text-subtle); display:flex; align-items:center; gap:7px; }
    .meta-card .k svg { width:14px; height:14px; color:var(--accent); }
    .meta-card .v { font-family:var(--font-mono); font-size:18px; margin-top:8px; }
    @media (max-width:720px) { .meta-grid { grid-template-columns:1fr 1fr; } }
  `],
})
export class CameraComponent {
  readonly cameraId = input.required<string>()

  camera  = signal<Camera | null>(null)
  loading = signal(true)
  error   = signal<string | null>(null)

  readonly direction = DIRECTION
  readonly lat = computed(() => (this.camera()?.location.coordinates[1] ?? 0).toFixed(4))
  readonly lon = computed(() => Math.abs(this.camera()?.location.coordinates[0] ?? 0).toFixed(4))

  constructor() {
    effect(() => {
      const id = this.cameraId()
      this.loadCamera(id)
      recordView(id).catch(() => {})
    })
  }

  private async loadCamera(id: string): Promise<void> {
    this.loading.set(true)
    this.error.set(null)
    try {
      this.camera.set(await getCamera(id))
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Request failed')
    } finally {
      this.loading.set(false)
    }
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleString()
  }
}
