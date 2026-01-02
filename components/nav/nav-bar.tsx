'use client';

import Link from 'next/link';

// Components
import { PageContainer } from '@/components/layout/page-container'

// Icons
import { EnvelopesIcon } from '@/components/ui/icons/envelopes-icon'
import { GitHubIcon } from '@/components/ui/icons/github-icon';


const DesktopNav = () => {
  return (
    <div className="hidden items-center justify-between px-4 py-4 md:flex">
      {/* Site Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 cursor-pointer group"
      >
        <EnvelopesIcon className='h-7 w-7 transition-colors duration-300 group-hover:text-[#FF2727]'/>
      </Link>

      <div className="flex items-center gap-10">
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/lokeam/echo-alpha"
            target="_blank"
            className="cursor-pointer group inline-block"
          >
            <GitHubIcon className='h-8 w-8 transition-colors duration-300 group-hover:text-[#FF2727]'/>
          </a>
        </div>
      </div>
    </div>
  )
}

// Main Nav
export const NavBar = () => {
  return (
    <PageContainer as="nav" className="bg-background">
      <DesktopNav />
    </PageContainer>
  )
}
