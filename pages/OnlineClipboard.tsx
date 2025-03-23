"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Loader2, Clipboard, ImageIcon, Upload, Download, Copy, Check, X } from "lucide-react"
import QRCode from "qrcode"
import { db } from "@/firebase"
import { collection, addDoc, getDocs, query, where } from "firebase/firestore"
import Image from "next/image"
import Link from "next/link"
import LoadingBar, { type LoadingBarRef } from "react-top-loading-bar"

interface ClipboardData {
  text: string
  imageUrl?: string
  code: string
  createdAt: Date
}

export default function OnlineClipboard() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

  const [text, setText] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [generatedCode, setGeneratedCode] = useState("")
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [inputCode, setInputCode] = useState("")
  const [retrievedData, setRetrievedData] = useState<ClipboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [retrieveLoading, setRetrieveLoading] = useState(false)
  const [textError, setTextError] = useState("")
  const [codeError, setCodeError] = useState("")
  const [activeTab, setActiveTab] = useState<"text" | "image">("text")
  const [copied, setCopied] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const generateRandomCode = () => Math.floor(1000 + Math.random() * 9000).toString()

  const handleImageUpload = async (file: File): Promise<string> => {
    if (process.env.NODE_ENV === "development") {
      const localUrl = URL.createObjectURL(file)
      return localUrl
    }

    if (!cloudName || !uploadPreset) {
      console.error("Cloudinary environment variables are missing.")
      alert("Image upload is not configured properly.")
      return ""
    }

    ref.current?.continuousStart() // Start loading bar for image upload

    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", uploadPreset)

    try {
      const res = await fetch(cloudinaryUrl, {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        throw new Error(`Upload failed with status ${res.status}`)
      }

      const data = await res.json()
      return data.secure_url
    } catch (error) {
      console.error("Image upload failed:", error)
      alert("Failed to upload image. Please try again.")
      return ""
    } finally {
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setImage(selectedFile)

      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleSubmit = async (): Promise<void> => {
    if (activeTab === "text" && !text.trim()) {
      setTextError("Please enter some text to save.")
      return
    } else if (activeTab === "image" && !image) {
      setTextError("Please select an image to upload.")
      return
    }

    setTextError("") // Clear previous error
    setLoading(true)
    ref.current?.continuousStart() // Start loading bar

    const randomCode = generateRandomCode()
    let imageUrl = ""

    if (image && (activeTab === "image" || (activeTab === "text" && text.trim()))) {
      imageUrl = await handleImageUpload(image)
    }

    const clipboardData: ClipboardData = {
      text: activeTab === "text" ? text : "",
      code: randomCode,
      createdAt: new Date(),
    }

    if (imageUrl) clipboardData.imageUrl = imageUrl

    try {
      await addDoc(collection(db, "clipboards"), clipboardData)

      // Generate URL based on environment
      const baseUrl = window.location.origin
      // Ensure the URL is properly formatted for both local and production
      const newUrl = `${baseUrl}/retrieve/${randomCode}`

      const qrData = await QRCode.toDataURL(newUrl)

      // setGeneratedUrl(newUrl)
      setGeneratedCode(randomCode)
      setQrCodeUrl(qrData)
      setText("")
      setImage(null)
      setImagePreview(null)
    } catch (error) {
      console.error("Error saving to clipboard:", error)
      setTextError("Failed to save. Please try again.")
    } finally {
      setLoading(false)
      ref.current?.complete()
    }
  }

  const displayFullUrl = () => {
    if (!generatedCode) return null

    const fullUrl = `${window.location.origin}/retrieve/${generatedCode}`

    return (
      <div className="mt-3">
        <div className="text-sm text-gray-600 mb-1">Full URL:</div>
        <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between overflow-x-auto">
          <span className="font-mono text-sm truncate mr-2">{fullUrl}</span>
          <button
            onClick={() => copyToClipboard(fullUrl)}
            className="flex-shrink-0 text-indigo-600 hover:text-indigo-800"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const clearForm = () => {
    setText("")
    setImage(null)
    setImagePreview(null)
    setTextError("")
  }

  const handleRetrieve = async () => {
    if (!inputCode.trim()) {
      setCodeError("Please enter the code to retrieve.")
      return
    }

    setCodeError("")
    setRetrieveLoading(true)
    ref.current?.continuousStart()

    try {
      const q = query(collection(db, "clipboards"), where("code", "==", inputCode))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]
        const data = doc.data() as ClipboardData
        setRetrievedData(data)
      } else {
        setCodeError("Invalid code. No data found.")
        setRetrievedData(null)
      }
    } catch (error) {
      console.error("Error retrieving data:", error)
      setCodeError("Failed to retrieve data. Please try again.")
    } finally {
      setRetrieveLoading(false)
      ref.current?.complete();
    }
  }

  const ref = useRef<LoadingBarRef>(null)

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100">
      <LoadingBar color="#000" ref={ref} shadow={true} />
      <header className="bg-gradient-to-r from-purple-100 to-indigo-200 text-white py-6 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-black">Online Clipboard</h1>
          <p className="text-black text-center max-w-2xl">
            Securely share text and images across devices with a simple code
          </p>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        {/* Create Section */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-8 border border-gray-200">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">Create New Clipboard</h2>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("text")}
              className={`flex items-center justify-center py-3 px-6 font-medium text-sm transition-all duration-300 ${activeTab === "text"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
            >
              <Clipboard className={`w-4 h-4 mr-2 ${activeTab === "text" ? "animate-bounce" : ""}`} />
              Text Clipboard
            </button>
            <button
              onClick={() => setActiveTab("image")}
              className={`flex items-center justify-center py-3 px-6 font-medium text-sm transition-all duration-300 ${activeTab === "image"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
            >
              <ImageIcon className={`w-4 h-4 mr-2 ${activeTab === "image" ? "animate-bounce" : ""}`} />
              Image Clipboard
            </button>
          </div>

          <div className="p-6">
            {/* Text Tab Content */}
            {activeTab === "text" && (
              <div className="space-y-4">
                <textarea
                  className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Type or paste your text here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                ></textarea>
              </div>
            )}

            {/* Image Tab Content */}
            {activeTab === "image" && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-all duration-300 hover:border-indigo-400 hover:bg-indigo-50">
                  {imagePreview ? (
                    <div className="relative">
                      <Image
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        width={300} // Replace with an appropriate width
                        height={300} // Replace with an appropriate width
                        className="max-h-64 mx-auto rounded-lg transition-transform duration-300 hover:scale-105"
                      />
                      <button
                        onClick={() => {
                          setImage(null)
                          setImagePreview(null)
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer transition-transform duration-300 hover:scale-105"
                    >
                      <Upload className="w-12 h-12 mx-auto text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">Click to select an image or drag and drop</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {textError && (
              <div className="mt-2 text-red-500 text-sm flex items-center">
                <X className="w-4 h-4 mr-1" />
                {textError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center transition-colors duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Save to Clipboard
                  </>
                )}
              </button>
              <button
                onClick={clearForm}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-lg font-medium flex items-center justify-center transition-colors duration-200"
              >
                <X className="w-5 h-5 mr-2" />
                Clear
              </button>
            </div>
          </div>

          {/* Generated Code Section */}
          {generatedCode && (
            <div
              className="bg-indigo-50 p-6 border-t border-indigo-100 transition-all duration-500 ease-in-out "
              id="generated-url-container"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Your Clipboard is Ready!</h3>
                  <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between mb-2 hover:shadow-md transition-shadow duration-300">
                    <span className="font-mono text-lg">Code: {generatedCode}</span>
                    <button
                      onClick={() => copyToClipboard(generatedCode)}
                      className="text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
                    >
                      {copied ? <Check className="w-5 h-5 animate-pulse" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  {displayFullUrl()}
                  <div className="mt-4">
                    <Link
                      href={`/retrieve/${generatedCode}`}
                      className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                    >
                      View Clipboard
                    </Link>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 animate-fadeIn">
                    Share this code or URL with others to give them access to your clipboard content.
                  </p>
                </div>

                {qrCodeUrl && (
                  <div className="flex-shrink-0">
                    <Image
                      src={qrCodeUrl || "/placeholder.svg"}
                      alt="QR Code"
                      width={120}
                      height={120}
                      className="border-4 border-white shadow-md rounded-lg hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Retrieve Section */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">Retrieve Clipboard</h2>
          </div>

          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Enter your 4-digit code"
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
              />
              <button
                onClick={handleRetrieve}
                disabled={retrieveLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center transition-colors duration-200"
              >
                {retrieveLoading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Retrieve
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {codeError && (
              <div className="mt-2 text-red-500 text-sm flex items-center">
                <X className="w-4 h-4 mr-1" />
                {codeError}
              </div>
            )}

            {/* Retrieved Data */}
            {retrievedData && (
              <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200 animate-fadeIn">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 animate-slideDown">Retrieved Content</h3>

                {retrievedData.text && (
                  <div className="mb-4 animate-slideUp">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-500">Text</h4>
                      <button
                        onClick={() => copyToClipboard(retrievedData.text)}
                        className="text-indigo-600 hover:text-indigo-800 p-1 transition-colors duration-200"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-gray-800 hover:shadow-md transition-shadow duration-300">
                      {retrievedData.text}
                    </div>
                  </div>
                )}

                {retrievedData.imageUrl && (
                  <div className="">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Image</h4>
                    <div className="bg-white p-2 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-300">
                      <Image
                        src={retrievedData.imageUrl || "/placeholder.svg"}
                        alt="Retrieved image"
                        width={300}
                        height={300}
                        className="max-h-64 mx-auto rounded-lg object-contain transition-transform duration-300 hover:scale-105"
                        onClick={() => window.open(retrievedData.imageUrl, "_blank")}
                      />
                      <div className="text-center mt-2">
                        <button
                          onClick={() => window.open(retrievedData.imageUrl, "_blank")}
                          className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
                        >
                          Click to view full size
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-6 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">Online Clipboard - Share content securely across devices</p>
          <p className="text-sm text-gray-400">
            This is a demo application. No legal action can be taken for any issues.
          </p>
        </div>
      </footer>
    </div>
  )
}

