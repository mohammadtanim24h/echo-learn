// app/my-journey/loading.tsx
import Image from 'next/image'

export default function ProfileSkeleton() {
  return (
    <main className='lg:w-3/4'>
      <section className='flex justify-between gap-4 max-sm:flex-col items-center'>
        <div className='flex gap-4 items-center'>
          <div className='w-[110px] h-[110px] bg-gray-200 rounded-lg animate-pulse' />
          <div className='flex flex-col gap-2'>
            <div className='h-8 w-48 bg-gray-200 rounded animate-pulse' />
            <div className='h-4 w-64 bg-gray-200 rounded animate-pulse' />
          </div>
        </div>
        <div className='flex gap-4'>
          <div className='border border-black rounded-lg p-3 gap-2 flex flex-col h-fit w-24'>
            <div className='h-8 w-8 bg-gray-200 rounded animate-pulse' />
            <div className='h-4 bg-gray-200 rounded animate-pulse' />
          </div>
          <div className='border border-black rounded-lg p-3 gap-2 flex flex-col h-fit w-24'>
            <div className='h-8 w-8 bg-gray-200 rounded animate-pulse' />
            <div className='h-4 bg-gray-200 rounded animate-pulse' />
          </div>
        </div>
      </section>
    </main>
  )
}
