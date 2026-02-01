import { SignUp } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

export default function Page() {
  return (
    <SignUp
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#8b5cf6',
          colorBackground: 'transparent',
          colorText: 'white',
          colorInputBackground: '#2D2D2D',
          colorInputText: 'white',
          borderRadius: '0.5rem',
        },
        elements: {
          card: 'shadow-none bg-transparent',
          rootBox: 'bg-transparent',
          headerTitle: 'text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200',
          headerSubtitle: 'text-neutral-400',
          socialButtonsBlockButton: 'bg-neutral-800/50 border-neutral-700 hover:bg-neutral-800 text-white transition-all hover:border-purple-500/30',
          socialButtonsBlockButtonText: 'text-white font-medium',
          dividerLine: 'bg-neutral-700',
          dividerText: 'text-neutral-400',
          formFieldLabel: 'text-neutral-300',
          formFieldInput: 'bg-neutral-900/50 border-neutral-700 text-white focus:border-purple-500 transition-all',
          formButtonPrimary: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg hover:shadow-purple-500/20 hover:opacity-90 transition-all !shadow-none normal-case',
          footerActionLink: 'text-purple-400 hover:text-purple-300',
          footerActionText: 'text-neutral-400',
        },
      }}
    />
  )
}
