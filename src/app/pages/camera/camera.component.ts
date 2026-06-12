import { Component, input, signal, effect, computed } from '@angular/core'
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component'
import { FooterComponent } from '../../components/footer/footer.component'
import { getCamera, recordView } from '../../../api/cameras'
import type { Camera } from '../../../api/cameras'

const DIRECTION_LABEL: Record<string, string> = {
  NB: 'Northbound', SB: 'Southbound', EB: 'Eastbound', WB: 'Westbound',
}

@Component({
  selector: 'app-camera',
  standalone: true,
  imports: [NavBarComponent, FooterComponent],
  templateUrl: './camera.component.html',
})
export class CameraComponent {
  readonly cameraId = input.required<string>()

  camera  = signal<Camera | null>(null)
  loading = signal(true)
  error   = signal<string | null>(null)

  readonly directionLabel = DIRECTION_LABEL

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
