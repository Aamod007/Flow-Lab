import ProfileForm from '@/components/forms/profile-form'
import React from 'react'
import ProfilePicture from './_components/profile-picture'
import AiKeysForm from './_components/ai-keys-form'
import OllamaManager from './_components/ollama-manager'
import { currentUser } from '@clerk/nextjs'
import { db } from '@/lib/db'

type Props = {}

const Settings = async (props: Props) => {
  const clerkUser = await currentUser()
  
  // Get user from database
  let user = null
  if (clerkUser) {
    try {
      user = await db.user.findUnique({
        where: { clerkId: clerkUser.id },
      })
    } catch (error) {
      // Database might not have clerkId column yet - migrations pending
      console.warn('Database query failed, using Clerk data:', error)
      // Try to find by email as fallback
      try {
        const email = clerkUser.emailAddresses?.[0]?.emailAddress
        if (email) {
          user = await db.user.findUnique({
            where: { email },
          })
        }
      } catch (fallbackError) {
        console.warn('Fallback query also failed:', fallbackError)
      }
    }
  }

  // Fallback for display if user not in DB yet
  const displayUser = {
    id: user?.id?.toString() || clerkUser?.id || '',
    name: user?.name || clerkUser?.firstName || '',
    email: user?.email || clerkUser?.emailAddresses?.[0]?.emailAddress || '',
    profileImage: user?.profileImage || clerkUser?.imageUrl || '',
  }

  const removeProfileImage = async () => {
    'use server'
    if (!clerkUser) return displayUser
    
    try {
      const updated = await db.user.update({
        where: { clerkId: clerkUser.id },
        data: { profileImage: null },
      })
      return {
        id: updated.id.toString(),
        name: updated.name || '',
        email: updated.email,
        profileImage: updated.profileImage || '',
      }
    } catch (error) {
      console.error('Error removing profile image:', error)
      // Try fallback with email
      try {
        const email = clerkUser.emailAddresses?.[0]?.emailAddress
        if (email) {
          const updated = await db.user.update({
            where: { email },
            data: { profileImage: null },
          })
          return {
            id: updated.id.toString(),
            name: updated.name || '',
            email: updated.email,
            profileImage: updated.profileImage || '',
          }
        }
      } catch (fallbackError) {
        console.error('Fallback update failed:', fallbackError)
      }
      return displayUser
    }
  }

  const uploadProfileImage = async (image: string) => {
    'use server'
    if (!clerkUser) return displayUser
    
    try {
      const updated = await db.user.update({
        where: { clerkId: clerkUser.id },
        data: { profileImage: image },
      })
      return {
        id: updated.id.toString(),
        name: updated.name || '',
        email: updated.email,
        profileImage: updated.profileImage || '',
      }
    } catch (error) {
      console.error('Error uploading profile image:', error)
      // Try fallback with email
      try {
        const email = clerkUser.emailAddresses?.[0]?.emailAddress
        if (email) {
          const updated = await db.user.update({
            where: { email },
            data: { profileImage: image },
          })
          return {
            id: updated.id.toString(),
            name: updated.name || '',
            email: updated.email,
            profileImage: updated.profileImage || '',
          }
        }
      } catch (fallbackError) {
        console.error('Fallback update failed:', fallbackError)
      }
      return displayUser
    }
  }

  const updateUserInfo = async (name: string) => {
    'use server'
    if (!clerkUser) return displayUser
    
    try {
      const updated = await db.user.update({
        where: { clerkId: clerkUser.id },
        data: { name },
      })
      return {
        id: updated.id.toString(),
        name: updated.name || '',
        email: updated.email,
        profileImage: updated.profileImage || '',
      }
    } catch (error) {
      console.error('Error updating user info:', error)
      // Try fallback with email
      try {
        const email = clerkUser.emailAddresses?.[0]?.emailAddress
        if (email) {
          const updated = await db.user.update({
            where: { email },
            data: { name },
          })
          return {
            id: updated.id.toString(),
            name: updated.name || '',
            email: updated.email,
            profileImage: updated.profileImage || '',
          }
        }
      } catch (fallbackError) {
        console.error('Fallback update failed:', fallbackError)
      }
      return displayUser
    }
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
          userImage={displayUser?.profileImage || ''}
          onUpload={uploadProfileImage}
        />
        <ProfileForm
          user={displayUser}
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
