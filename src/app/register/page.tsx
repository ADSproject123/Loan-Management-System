'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Building2, AlertCircle, CheckCircle, Upload, User, Phone, MapPin, Mail, Lock, FileText, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Steps } from '@/components/ui/Steps'
import { Card } from '@/components/ui/Card'
import { registerMember } from '@/app/actions/member'

const STEPS = [
  { id: 1, label: 'Account', description: 'Create credentials' },
  { id: 2, label: 'Personal', description: 'Your information' },
  { id: 3, label: 'Referee', description: 'Add referee' },
  { id: 4, label: 'Documents', description: 'Upload ID docs' },
  { id: 5, label: 'Done', description: 'Submitted' },
]

interface FormData {
  email: string
  password: string
  confirmPassword: string
  full_name: string
  phone: string
  address: string
  id_number: string
  resident_book_number: string
  referee_email: string
  id_document: File | null
  resident_book: File | null
}

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    address: '',
    id_number: '',
    resident_book_number: '',
    referee_email: '',
    id_document: null,
    resident_book: null,
  })

  const updateField = (field: keyof FormData, value: string | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateStep1 = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields.')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return false
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!formData.full_name || !formData.phone || !formData.id_number) {
      setError('Please fill in your full name, phone number, and ID number.')
      return false
    }
    return true
  }

  const handleNext = () => {
    setError(null)
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep((prev) => Math.min(prev + 1, 5))
  }

  const handleBack = () => {
    setError(null)
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const payload = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value) payload.append(key, value)
      })

      const result = await registerMember(payload)
      if (!result.success) {
        setError(result.error ?? 'Registration failed. Please try again.')
        return
      }

      setStep(5)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white font-bold text-2xl hover:text-blue-200 transition-colors">
            <Building2 className="w-8 h-8" />
            SanSam
          </Link>
          <p className="text-blue-200 mt-2 text-sm">New Member Registration</p>
        </div>

        {/* Steps Indicator */}
        {step < 5 && (
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-6">
            <Steps steps={STEPS} currentStep={step} />
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border-b border-red-200 text-red-700 p-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="p-8">
            {/* Step 1: Account Credentials */}
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h2>
                <p className="text-gray-500 text-sm mb-6">Set up your login credentials for SanSam Member Portal.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        placeholder="At least 8 characters"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => updateField('confirmPassword', e.target.value)}
                        placeholder="Re-enter your password"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Personal Information */}
            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
                <p className="text-gray-500 text-sm mb-6">Please provide your personal details for membership verification.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name (as on ID)</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => updateField('full_name', e.target.value)}
                        placeholder="Your full legal name"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder="0812345678"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">ID Card Number</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.id_number}
                          onChange={(e) => updateField('id_number', e.target.value)}
                          placeholder="13-digit ID number"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Resident Book Number</label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.resident_book_number}
                          onChange={(e) => updateField('resident_book_number', e.target.value)}
                          placeholder="Book number"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <textarea
                        value={formData.address}
                        onChange={(e) => updateField('address', e.target.value)}
                        placeholder="Your current address"
                        rows={3}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Referee */}
            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Add a Referee</h2>
                <p className="text-gray-500 text-sm mb-6">
                  A referee must be an existing SanSam member who knows you personally. They will
                  receive a verification request.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-blue-900 text-sm font-medium mb-1">What is a Referee?</p>
                  <p className="text-blue-700 text-sm">
                    A referee is an existing SanSam member who vouches for your membership application.
                    They must verify your identity and confirm your application. You can ask a colleague
                    or friend who is already a member.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Referee&apos;s Email Address <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.referee_email}
                      onChange={(e) => updateField('referee_email', e.target.value)}
                      placeholder="referee@example.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    If you don&apos;t have a referee yet, you can skip this step and add one later, or contact a SanSam administrator.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Documents */}
            {step === 4 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Documents</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Please upload clear photos of your ID card and Resident Book (Tabien Baan).
                  Files should be JPG, PNG, or PDF format.
                </p>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID Card (front &amp; back)
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      {formData.id_document ? (
                        <span className="text-sm text-blue-700 font-medium">{formData.id_document.name}</span>
                      ) : (
                        <>
                          <span className="text-sm text-gray-500">Click to upload ID card</span>
                          <span className="text-xs text-gray-400 mt-1">JPG, PNG or PDF, max 10MB</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => updateField('id_document', e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resident Book (Tabien Baan)
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      {formData.resident_book ? (
                        <span className="text-sm text-blue-700 font-medium">{formData.resident_book.name}</span>
                      ) : (
                        <>
                          <span className="text-sm text-gray-500">Click to upload Resident Book</span>
                          <span className="text-xs text-gray-400 mt-1">JPG, PNG or PDF, max 10MB</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => updateField('resident_book', e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm font-medium">Before Submitting:</p>
                    <ul className="text-yellow-700 text-sm mt-2 space-y-1 list-disc list-inside">
                      <li>Ensure all document photos are clear and readable</li>
                      <li>Documents must be valid and not expired</li>
                      <li>Your account will be pending admin approval (1-3 business days)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Success */}
            {step === 5 && (
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted!</h2>
                <p className="text-gray-600 mb-2">
                  Your membership application has been received. Our team will review your documents
                  within <strong>1-3 business days</strong>.
                </p>
                <p className="text-gray-600 mb-6">
                  You will receive a notification when your account is approved. Once approved,
                  you can log in and start using SanSam services.
                </p>

                <Card className="bg-blue-50 border-blue-200 text-left mb-6">
                  <p className="text-blue-900 font-semibold mb-3">What happens next?</p>
                  <div className="space-y-2">
                    {[
                      'Admin reviews your ID and Resident Book documents',
                      'Referee receives verification request (if provided)',
                      'Account is approved and activated',
                      'You can log in and start saving!',
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-blue-900 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-blue-800 text-sm">{item}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="flex gap-4 justify-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 bg-blue-900 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-800 transition-colors text-sm"
                  >
                    Go to Login
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          {step < 5 && (
            <div className="px-8 pb-8 flex justify-between items-center">
              <div>
                {step > 1 && (
                  <Button variant="outline" onClick={handleBack} disabled={loading}>
                    Back
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">Step {step} of 4</span>
                {step < 4 ? (
                  <Button onClick={handleNext} disabled={loading}>
                    Continue
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} loading={loading}>
                    Submit Application
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="px-8 pb-6 text-center border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-500">
              Already a member?{' '}
              <Link href="/login" className="text-blue-700 font-medium hover:text-blue-900 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
