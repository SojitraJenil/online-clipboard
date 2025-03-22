"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import QRCode from "qrcode";
import { db } from "@/firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import Image from "next/image";

interface ClipboardData {
  text: string;
  imageUrl?: string;
  code: string;
  createdAt: Date;
}

export default function OnlineClipboard() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [retrievedData, setRetrievedData] = useState<ClipboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [textError, setTextError] = useState("");
  const [codeError, setCodeError] = useState("");
  console.log('--------------retrievedData.imageUrl :>> ', retrievedData);

  console.log("================>Cloud Name:", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
  console.log("================>Upload Preset:", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);


  const generateRandomCode = () => Math.floor(1000 + Math.random() * 9000).toString();

  const handleImageUpload = async (file: File): Promise<string> => {
    if (process.env.NODE_ENV === "development") {
      const localUrl = URL.createObjectURL(file);
      return localUrl;
    }

    if (!cloudName || !uploadPreset) {
      console.error("Cloudinary environment variables are missing.");
      alert("Image upload is not configured properly.");
      return "";
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      const res = await fetch(cloudinaryUrl, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed with status ${res.status}`);
      }

      const data = await res.json();
      return data.secure_url;
    } catch (error) {
      console.error("Image upload failed:", error);
      alert("Failed to upload image. Please try again.");
      return "";
    }
  };



  const handleSubmit = async (): Promise<void> => {
    if (!text.trim() && !image) {
      setTextError("Enter some text or upload an image.");
      return;
    }
    setTextError(""); // Clear previous error

    setLoading(true);
    const randomCode = generateRandomCode();
    let imageUrl = "";

    if (image) {
      imageUrl = await handleImageUpload(image);
    }

    const clipboardData: ClipboardData = {
      text,
      code: randomCode,
      createdAt: new Date(),
    };

    if (imageUrl) clipboardData.imageUrl = imageUrl;

    await addDoc(collection(db, "clipboards"), clipboardData);

    const newUrl = `${window.location.origin}/retrieve/${randomCode}`;
    const qrData = await QRCode.toDataURL(newUrl);

    setGeneratedUrl(newUrl);
    setGeneratedCode(randomCode);
    setQrCodeUrl(qrData);
    setText("");
    setImage(null);
    setLoading(false);
  };

  const handleRetrieve = async () => {
    if (!inputCode.trim()) {
      setCodeError("Enter a valid code.");
      return;
    }
    setCodeError("");

    const q = query(collection(db, "clipboards"), where("code", "==", inputCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      setRetrievedData({ text: "No data found for this code.", code: "", createdAt: new Date() });
    } else {
      setRetrievedData(querySnapshot.docs[0].data() as ClipboardData);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center py-12 px-6 bg-gray-50">
      <h1 className="text-4xl font-bold text-indigo-600 mb-6">Online Clipboard</h1>

      <div className="w-full max-w-3xl bg-white shadow-lg rounded-lg p-6 border border-gray-200">
        <textarea
          className="w-full h-40 p-4 border border-gray-300 rounded-md"
          placeholder="Paste your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        ></textarea>

        {/* Error Message for Text Input */}
        {textError && <p className="text-red-500 text-sm mt-2">{textError}</p>}

        <input
          type="file"
          accept="image/*"
          className="mt-3"
          onChange={(e) => e.target.files && setImage(e.target.files[0])}
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`mt-4 text-white px-6 py-2 rounded-lg w-full ${loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"}`}
        >
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Generate URL"}
        </button>

        {generatedUrl && (
          <div className="mt-4 bg-gray-100 p-4 rounded-lg">
            <p className="mt-2">Code: <strong>{generatedCode}</strong></p>
            {qrCodeUrl && <Image src={qrCodeUrl} alt="QR Code" className="mt-4 w-40" width={160} height={160} />
            }
          </div>
        )}
      </div>

      {/* Retrieve Section */}
      <div className="w-full max-w-3xl bg-white shadow-lg rounded-lg p-6 border border-gray-200 mt-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Retrieve Clipboard Data</h2>
        <input
          type="text"
          placeholder="Enter your code"
          className="w-full p-3 border border-gray-300 rounded-md"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
        />

        {/* Error Message for Code Input */}
        {codeError && <p className="text-red-500 text-sm mt-2">{codeError}</p>}

        <button
          onClick={handleRetrieve}
          className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 w-full"
        >
          <Search className="inline-block mr-2" /> Retrieve
        </button>

        {retrievedData && (
          <div className="mt-4 bg-gray-100 p-4 rounded-lg">
            <p className="text-gray-700">Retrieved Text:</p>
            <p>{retrievedData.text}</p>

            {/* Display and Download Image */}
            {retrievedData.imageUrl && (
              <div className="mt-4">
                <p className="text-gray-700 font-semibold">Stored Image:</p>
                <Image
                  src={retrievedData.imageUrl}
                  alt="Stored"
                  className="w-40 rounded-lg mt-2 cursor-pointer"
                  width={160}
                  height={160}
                  onClick={() => window.open(retrievedData.imageUrl, "_blank")}
                />
              </div>
            )}

          </div>
        )}
      </div>
    </main>
  );
}
