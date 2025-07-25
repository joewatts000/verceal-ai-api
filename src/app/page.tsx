import LocalContent from "./localContent";

const isLocalDev = process.env.NODE_ENV === "development";

export default function Home() {
  return isLocalDev ? <LocalContent /> : (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">404 page not found</h1>
      </div>
    </main>
  )
}
