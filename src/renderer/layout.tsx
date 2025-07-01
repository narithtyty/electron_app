import { NavLink, Outlet } from 'react-router-dom'

import { Separator } from './components/ui/separator'
import { UserProfile } from './components/UserProfile'

export function Layout() {
  return (
    <main className="flex flex-col items-center gap-5 mt-1">
      <nav className="flex w-full justify-between items-center p-4 bg-white shadow-sm">
        <div className="flex gap-2">
          <NavLink to="/">Main</NavLink>

          <Separator orientation="vertical" />

          <NavLink to="/about">About</NavLink>

          <Separator orientation="vertical" />

          <NavLink to="/todos">Todos</NavLink>

          <Separator orientation="vertical" />

          <NavLink to="/transactions">Transactions</NavLink>

          <Separator orientation="vertical" />

          <NavLink to="/api-demo">API Demo</NavLink>
        </div>
        
        <UserProfile />
      </nav>

      <section className="items-center justify-center flex flex-col gap-6">
        <Outlet />
      </section>
    </main>
  )
}
