import json from '~/package.json'

import { Button } from '../components/button'

export function AboutScreen() {
  return (
    <div>
      <h1 className="title text-5xl">About</h1>

      <main className="flex flex-col gap-4 mt-4">
        <p className="text-lg">{json.description}</p>
        <div className="grid gap-2">
          <p><span className="font-semibold">Version:</span> {json.version}</p>
          {json.author && <p><span className="font-semibold">Author:</span> {json?.author?.name}</p>}
        </div>
        <Button className="mt-4">Learn More</Button>
      </main>
    </div>
  )
}