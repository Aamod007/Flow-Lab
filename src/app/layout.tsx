import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/providers/theme-provider'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import ModalProvider from '@/providers/modal-provider'
import { Toaster } from '@/components/ui/sonner'
import { BillingProvider } from '@/providers/billing-provider'

const font = DM_Sans({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Flowlab',
  description: 'Automate Your Work With Flowlab.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={font.className}>
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          appearance={{ baseTheme: dark }}
          localization={{
            signIn: {
              start: {
                title: 'Sign in to FlowLab',
                subtitle: 'Welcome back! Please sign in to continue',
              },
              emailCode: {
                title: 'Check your email',
                subtitle: 'to continue to FlowLab',
              },
              emailLink: {
                title: 'Check your email',
                subtitle: 'to continue to FlowLab',
              },
              password: {
                title: 'Enter your password',
                subtitle: 'to continue to FlowLab',
              },
              phoneCode: {
                title: 'Check your phone',
                subtitle: 'to continue to FlowLab',
              },
            },
            signUp: {
              start: {
                title: 'Create your FlowLab account',
                subtitle: 'Welcome! Please fill in the details to get started',
              },
            },
            userProfile: {
              start: {
                headerTitle__account: 'FlowLab Account',
              },
            },
          }}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <BillingProvider>
              <ModalProvider>
                {children}
                <Toaster />
              </ModalProvider>
            </BillingProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
