import { lazy, Suspense } from 'react'
import { Route } from 'react-router-dom'

import { Router } from 'lib/electron-router-dom'
import { Layout } from './layout'
import { MinimalLoader } from './components/LoadingSpinner'

// Lazy load screens for better performance and to trigger Suspense
const AboutScreen = lazy(() => import('./screens/about.screen').then(module => ({ default: module.AboutScreen })))
const MainScreen = lazy(() => import('./screens/main.screen').then(module => ({ default: module.MainScreen })))
const TodosScreen = lazy(() => import('./screens/todos.screen').then(module => ({ default: module.TodosScreen })))
const ExampleUsageScreen = lazy(() => import('./screens/example-usage.screen').then(module => ({ default: module.ExampleUsageScreen })))
const CsvUploadScreen = lazy(() => import('./screens/csv-upload.screen').then(module => ({ default: module.CsvUploadScreen })))

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
            path="/example-usage"
            element={
              <Suspense fallback={<MinimalLoader />}>
                <ExampleUsageScreen />
              </Suspense>
            }
          />
          <Route
            path="/csv-upload"
            element={
              <Suspense fallback={<MinimalLoader />}>
                <CsvUploadScreen />
              </Suspense>
            }
          />
        </Route>
      }
    />
  )
}
