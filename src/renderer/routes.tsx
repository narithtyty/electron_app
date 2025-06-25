import { lazy, Suspense } from 'react'
import { Route } from 'react-router-dom'

import { Router } from 'lib/electron-router-dom'
import { Layout } from './layout'
import { MinimalLoader } from './components/LoadingSpinner'

// Lazy load screens for better performance and to trigger Suspense
const AboutScreen = lazy(() => import('./screens/about.screen').then(module => ({ default: module.AboutScreen })))
const MainScreen = lazy(() => import('./screens/main.screen').then(module => ({ default: module.MainScreen })))
const TodosScreen = lazy(() => import('./screens/todos.screen').then(module => ({ default: module.TodosScreen })))
const ApiDemoScreen = lazy(() => import('./screens/api-demo.screen').then(module => ({ default: module.ApiDemoScreen })))

export function Routes() {
  return (
    <Router
      main={
        <Route path="/" element={<Layout />}>
          <Route
            path="/"
            element={
              <Suspense fallback={<MinimalLoader />}>
                <MainScreen />
              </Suspense>
            }
          />
          <Route
            path="/about"
            element={
              <Suspense fallback={<MinimalLoader />}>
                <AboutScreen />
              </Suspense>
            }
          />
          <Route
            path="/todos"
            element={
              <Suspense fallback={<MinimalLoader />}>
                <TodosScreen />
              </Suspense>
            }
          />
          <Route
            path="/api-demo"
            element={
              <Suspense fallback={<MinimalLoader />}>
                <ApiDemoScreen />
              </Suspense>
            }
          />
        </Route>
      }
    />
  )
}
