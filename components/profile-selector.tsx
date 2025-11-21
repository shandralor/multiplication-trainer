'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  getAllProfiles, 
  getCurrentProfile, 
  setCurrentProfileId, 
  createProfile,
  deleteProfile,
  type UserProfile 
} from '@/lib/profile-manager'

type ProfileSelectorProps = {
  onProfileChange?: () => void
}

export function ProfileSelector({ onProfileChange }: ProfileSelectorProps) {
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null)
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([])
  const [showNewProfileDialog, setShowNewProfileDialog] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')

  const loadProfiles = useCallback(() => {
    const profiles = getAllProfiles()
    const current = getCurrentProfile()
    setAllProfiles(profiles)
    setCurrentProfile(current)
  }, [])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  const handleSwitchProfile = (profileId: string) => {
    setCurrentProfileId(profileId)
    loadProfiles()
    if (onProfileChange) onProfileChange()
  }

  const handleCreateProfile = () => {
    if (newProfileName.trim()) {
      createProfile(newProfileName.trim())
      setNewProfileName('')
      setShowNewProfileDialog(false)
      loadProfiles()
      if (onProfileChange) onProfileChange()
    }
  }

  const handleDeleteProfile = (profileId: string) => {
    if (allProfiles.length <= 1) {
      alert('Je moet minimaal één profiel hebben!')
      return
    }
    
    if (confirm('Weet je zeker dat je dit profiel wilt verwijderen?')) {
      deleteProfile(profileId)
      loadProfiles()
      if (onProfileChange) onProfileChange()
    }
  }

  if (!currentProfile) return null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <span className="text-xl">👤</span>
            <span className="font-semibold text-gray-800 dark:text-white hidden sm:inline">
              {currentProfile.name}
            </span>
            <span className="text-gray-400">▼</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
            PROFIELEN
          </div>
          {allProfiles.map(profile => (
            <DropdownMenuItem
              key={profile.id}
              onClick={() => handleSwitchProfile(profile.id)}
              className={`flex items-center justify-between ${
                profile.id === currentProfile.id ? 'bg-green-50 dark:bg-green-900/20' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">👤</span>
                <span className="font-medium">{profile.name}</span>
                {profile.id === currentProfile.id && (
                  <span className="text-green-600 dark:text-green-400">✓</span>
                )}
              </div>
              {profile.id !== currentProfile.id && allProfiles.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteProfile(profile.id)
                  }}
                  className="text-red-500 hover:text-red-700 ml-2"
                  title="Verwijder profiel"
                >
                  🗑️
                </button>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowNewProfileDialog(true)}
            className="text-green-600 dark:text-green-400 font-semibold"
          >
            <span className="mr-2">➕</span>
            Nieuw Profiel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* New Profile Dialog */}
      <Dialog open={showNewProfileDialog} onOpenChange={setShowNewProfileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuw Profiel Aanmaken</DialogTitle>
            <DialogDescription>
              Kies een naam voor je nieuwe profiel
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder="Voer een naam in..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateProfile()
                }
              }}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewProfileDialog(false)
                  setNewProfileName('')
                }}
              >
                Annuleren
              </Button>
              <Button
                onClick={handleCreateProfile}
                disabled={!newProfileName.trim()}
                className="bg-gradient-success text-white"
              >
                Aanmaken
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
