import { Routes } from '@angular/router'

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'city/:cityName',
    loadComponent: () => import('./pages/city/city.component').then(m => m.CityComponent),
  },
  {
    path: 'camera/:cameraId',
    loadComponent: () => import('./pages/camera/camera.component').then(m => m.CameraComponent),
  },
  {
    path: 'mostsearched',
    loadComponent: () => import('./pages/most-searched/most-searched.component').then(m => m.MostSearchedComponent),
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
]
