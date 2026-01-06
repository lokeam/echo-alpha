'use client';

import Link from 'next/link';

// Components
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/ui/button';

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
        <span className="text-[#FF2727] text-3xl font-bold italic tracking-tight" style={{ fontFamily: 'var(--font-inter)', fontWeight: 700, fontStyle: 'italic' }}>echo alpha</span>
      </Link>

      <div className="flex items-center gap-10">
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/lokeam/echo-alpha"
            target="_blank"
            className="cursor-pointer group inline-block"
          >
            <GitHubIcon className='h-7 w-7 transition-colors duration-300 group-hover:text-[#FF2727]'/>
          </a>

          <div>
            <Button asChild className="w-full">
              <Link href="/demo">
                Start Demo
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main Nav
export const NavBar = () => {
  return (
    <nav className="border-b border-gray-300 bg-background">
      <PageContainer>
        <DesktopNav />
      </PageContainer>
    </nav>
  )
}
