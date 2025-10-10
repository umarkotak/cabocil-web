import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BirdIcon, BookOpen, BotMessageSquare, BrickWall, CarIcon, Circle, FlowerIcon, MessageCircleQuestion, Puzzle, Worm, WormIcon,  } from 'lucide-react'

import cabocilAPI from '@/apis/cabocil_api'
import Utils from '@/models/Utils'

export default function Home() {
  const searchParams = useSearchParams()

  return (
    <main className="pb-[100px] p-4">
      <div className="w-full max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
        <Link href="/sahabat_ai/chat" className='hover:scale-105 duration-300'>
          <div className='flex flex-col gap-2 border shadow-sm p-2 rounded-lg'>
            <img
              src="/images/sahabat1.png"
              className='w-full rounded-lg shadow-sm'
            />
            <h1 className='text-xl flex gap-1 items-center justify-center'><BrickWall size={24} /> Chat</h1>
          </div>
        </Link>
      </div>
    </main>
  )
}
