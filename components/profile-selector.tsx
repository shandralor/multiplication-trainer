'use client'

import { useMemo, useState } from 'react'
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
  getProfileVersion,
  setCurrentProfileId,
  createProfile,
  deleteProfile,
} from '@/lib/profile-manager'
import { useProfile } from '@/lib/use-profile'

type ProfileSelectorProps = {
  onProfileChange?: () => void
}

export function ProfileSelector({ onProfileChange }: ProfileSelectorProps) {
  const [showNewProfileDialog, setShowNewProfileDialog] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')

  // Reading through useProfile rather than a local snapshot: the picker
  // used to load once on mount, which meant it rendered nothing at all
  // when the default profile was still being created alongside it.
  const currentProfile = useProfile()
  const allProfiles = useMemo(
    () => (currentProfile ? getAllProfiles() : []),
    // getProfileVersion changes on every write, which is what makes the
    // list pick up a newly created or deleted profile.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentProfile, getProfileVersion()],
  )

  const handleSwitchProfile = (profileId: string) => {
    setCurrentProfileId(profileId)
    onProfileChange?.()
  }

  const handleCreateProfile = () => {
    if (newProfileName.trim()) {
      createProfile(newProfileName.trim())
      setNewProfileName('')
      setShowNewProfileDialog(false)
      onProfileChange?.()
    }
  }

  const handleDeleteProfile = (profileId: string) => {
    if (allProfiles.length <= 1) {
      alert('Je moet minimaal één profiel hebben!')
      return
    }

    if (confirm('Weet je zeker dat je dit profiel wilt verwijderen?')) {
      deleteProfile(profileId)
      onProfileChange?.()
    }
  }

  if (!currentProfile) return null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full border border-vault-line px-2.5 py-1 transition-colors hover:border-brass">
            <span aria-hidden className="grid h-6 w-6 place-items-center rounded-full bg-vault-card text-sm">
              🦝
            </span>
            <span className="font-display text-[13px] font-bold tracking-tight">
              {currentProfile.name}
            </span>
            <span aria-hidden className="text-[9px] text-vault-dim">▼</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-vault-dim">
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
