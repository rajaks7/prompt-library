"use client"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"

export default function Home() {
  const [prompts, setPrompts] = useState([])

  useEffect(() => {
    const fetchPrompts = async () => {
      let { data, error } = await supabase.from("prompts").select("*")
      if (error) console.error(error)
      else setPrompts(data)
    }
    fetchPrompts()
  }, [])

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Prompt Library</h1>
      <ul className="space-y-3">
        {prompts.map((p) => (
          <li key={p.id} className="border p-4 rounded">
            <h2 className="font-semibold">{p.title}</h2>
            <p className="text-gray-700">{p.description}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
