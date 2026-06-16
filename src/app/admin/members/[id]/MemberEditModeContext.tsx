'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type MemberEditModeContextValue = {
  isEditing: boolean
  setIsEditing: (value: boolean) => void
  exitEditMode: () => void
  isSaving: boolean
  setIsSaving: (value: boolean) => void
  hasSaveForm: boolean
  registerSaveForm: (form: HTMLFormElement | null) => void
  triggerSave: () => void
}

const MemberEditModeContext = createContext<MemberEditModeContextValue | null>(null)

export function MemberEditModeProvider({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasSaveForm, setHasSaveForm] = useState(false)
  const saveFormRef = useRef<HTMLFormElement | null>(null)

  const registerSaveForm = useCallback((form: HTMLFormElement | null) => {
    saveFormRef.current = form
    setHasSaveForm(Boolean(form))
  }, [])

  const triggerSave = useCallback(() => {
    saveFormRef.current?.requestSubmit()
  }, [])

  const exitEditMode = useCallback(() => {
    setIsEditing(false)
    setIsSaving(false)
    saveFormRef.current = null
    setHasSaveForm(false)
  }, [])

  useEffect(() => {
    if (!isEditing) {
      setIsSaving(false)
      saveFormRef.current = null
      setHasSaveForm(false)
    }
  }, [isEditing])

  return (
    <MemberEditModeContext.Provider
      value={{
        isEditing,
        setIsEditing,
        exitEditMode,
        isSaving,
        setIsSaving,
        hasSaveForm,
        registerSaveForm,
        triggerSave,
      }}
    >
      {children}
    </MemberEditModeContext.Provider>
  )
}

export function useMemberEditMode() {
  const context = useContext(MemberEditModeContext)
  if (!context) {
    throw new Error('useMemberEditMode must be used within MemberEditModeProvider')
  }
  return context
}

export function useRegisterMemberEditForm(isSaving: boolean) {
  const { registerSaveForm, setIsSaving } = useMemberEditMode()

  const formRef = useCallback(
    (node: HTMLFormElement | null) => {
      registerSaveForm(node)
    },
    [registerSaveForm]
  )

  useEffect(() => {
    setIsSaving(isSaving)
  }, [isSaving, setIsSaving])

  return formRef
}
