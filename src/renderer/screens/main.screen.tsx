
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/button'
import { Modal } from '../components/modal'

export function MainScreen() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <header className="flex flex-col items-center">
        <h1 className="title text-5xl">Electron Router DOM</h1>

        <p className="text-lg text-muted-foreground">
          A react-router-dom adapter for Electron apps.
        </p>
        <Link to="/todos" className="mt-4 text-blue-500 hover:underline">View Todos</Link>
        <Button className="mt-4" onClick={() => setIsModalOpen(true)}>Get Started</Button>
        
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <h2 className="text-2xl font-semibold mb-4">Getting Started Guide</h2>
          <p className="text-muted-foreground mb-4">
            Here's how to integrate Electron Router DOM in your project...
          </p>
          <Button onClick={() => setIsModalOpen(false)}>Close</Button>
        </Modal>
      </header>

      <main className="mt-8 max-w-2xl mx-auto">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Features</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Seamless integration with react-router-dom</li>
            <li>Electron-specific routing capabilities</li>
            <li>Main process ↔ Renderer process communication</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-6">Getting Started</h2>
          <p className="text-muted-foreground">
            Import and use just like react-router-dom, with additional Electron-specific features.
          </p>
        </div>
      </main>
    </>
  )
}