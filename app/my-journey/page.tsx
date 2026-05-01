// app/my-journey/page.tsx
'use client'

import { useUserCompanions, useUserSessions } from '@/lib/hooks/use-companions'
import CompanionList from '@/components/CompanionList'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useUser } from '@clerk/nextjs'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Profile() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
    }
  }, [isLoaded, user, router])

  const { data: companions = [], isLoading: isLoadingCompanions } = useUserCompanions(user?.id || '')
  const { data: sessionHistory = [], isLoading: isLoadingSessions } = useUserSessions(user?.id || '')

  if (!isLoaded || !user) {
    return null // Will redirect
  }

  return (
    <main className='lg:w-3/4'>
      <section className='flex justify-between gap-4 max-sm:flex-col items-center'>
        <div className='flex gap-4 items-center'>
          <Image
            src={user.imageUrl}
            alt={user.firstName!}
            width={110}
            height={110}
          />
          <div className='flex flex-col gap-2'>
            <h1 className='font-bold text-2xl'>
              {user.firstName} {user.lastName}
            </h1>
            <p className='text-sm text-muted-foreground'>
              {user.emailAddresses[0]?.emailAddress}
            </p>
          </div>
        </div>
        <div className='flex gap-4'>
          <div className='border border-black rounded-lg p-3 gap-2 flex flex-col h-fit'>
            <div className='flex gap-2 items-center'>
              <Image
                src='/icons/check.svg'
                alt='checkmark'
                width={22}
                height={22}
              />
              <p className='text-2xl font-bold'>
                {isLoadingSessions ? '...' : sessionHistory.length}
              </p>
            </div>
            <div>Lessons completed</div>
          </div>
          <div className='border border-black rounded-lg p-3 gap-2 flex flex-col h-fit'>
            <div className='flex gap-2 items-center'>
              <Image
                src='/icons/cap.svg'
                alt='cap'
                width={22}
                height={22}
              />
              <p className='text-2xl font-bold'>
                {isLoadingCompanions ? '...' : companions.length}
              </p>
            </div>
            <div>Companions created</div>
          </div>
        </div>
      </section>
      <Accordion type='multiple'>
        <AccordionItem value='recent'>
          <AccordionTrigger className='text-2xl font-bold'>
            Recent Sessions
          </AccordionTrigger>
          <AccordionContent>
            {isLoadingSessions ? (
              <p>Loading...</p>
            ) : (
              <CompanionList
                title='Recent Sessions'
                companions={sessionHistory}
              />
            )}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value='companions'>
          <AccordionTrigger className='text-2xl font-bold'>
            My Companions ({companions.length})
          </AccordionTrigger>
          <AccordionContent>
            {isLoadingCompanions ? (
              <p>Loading...</p>
            ) : (
              <CompanionList
                title='My Companions'
                companions={companions}
              />
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </main>
  )
}
