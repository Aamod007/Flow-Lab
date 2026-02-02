import ProfileForm from '@/components/forms/profile-form'
import React from 'react'
import ProfilePicture from './_components/profile-picture'
import AiKeysForm from './_components/ai-keys-form'
import OllamaManager from './_components/ollama-manager'

type Props = {}

const Settings = async (props: Props) => {
  // Mock user for demo purposes
  const user = {
    id: 'demo-user',
    name: 'Demo User',
    email: 'demo@example.com',
    profileImage: '',
  }

  const removeProfileImage = async () => {
    'use server'
    console.log('Profile image removed')
    return user
  }

  const uploadProfileImage = async (image: string) => {
    'use server'
    console.log('Profile image uploaded:', image)
    return user
  }

  const updateUserInfo = async (name: string) => {
    'use server'
    console.log('User info updated:', name)
    return user
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
        <span>Settings</span>
      </h1>
      <div className="flex flex-col gap-10 p-6">
        <div>
          <h2 className="text-2xl font-bold">User Profile</h2>
          <p className="text-base text-white/50">
            Add or update your information
          </p>
        </div>
        <ProfilePicture
          onDelete={removeProfileImage}
          userImage={user?.profileImage || ''}
          onUpload={uploadProfileImage}
        />
        <ProfileForm
          user={user}
          onUpdate={updateUserInfo}
        />
        <div>
          <h2 className="text-2xl font-bold mb-4">AI Configuration</h2>
          <AiKeysForm />
        </div>
        <div>
          <OllamaManager />
        </div>
      </div>
    </div>
  )
}

export default Settings
