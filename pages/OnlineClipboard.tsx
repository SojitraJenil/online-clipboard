"use client";

import { useState } from "react";
import { Copy, Search, Loader2 } from "lucide-react";
import QRCode from "qrcode";
import { db } from "@/firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

export default function OnlineClipboard() {
  const [text, setText] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [retrievedText, setRetrievedText] = useState("");
  const [loading, setLoading] = useState(false);

  const generateRandomCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleSubmit = async () => {
    if (!text.trim()) return alert("Enter some text");

    setLoading(true);
    const randomCode = generateRandomCode();
    const docRef = await addDoc(collection(db, "clipboards"), {
      text,
      code: randomCode,
      createdAt: new Date(),
    });

    const newUrl = `${window.location.origin}/retrieve/${docRef.id}`;

    // Generate QR Code
    const qrData = await QRCode.toDataURL(newUrl);

    // Set URL and Code before clearing text
    setGeneratedUrl(newUrl);
    setGeneratedCode(randomCode);
    setQrCodeUrl(qrData);

    // Clear text after updating other states
    setText("");

    setLoading(false);
  };


  const handleRetrieve = async () => {
    if (!inputCode.trim()) return alert("Enter a valid code");

    const q = query(collection(db, "clipboards"), where("code", "==", inputCode));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data();
      setRetrievedText(docData.text);
    } else {
      setRetrievedText("No data found for this code.");
    }
  };


  return (
    <main className="min-h-screen flex flex-col items-center py-12 px-6 bg-gray-50">
      <h1 className="text-4xl font-bold text-indigo-600 mb-6">Online Clipboard</h1>

      {/* Text Input Section */}
      <div className="w-full max-w-3xl bg-white shadow-lg rounded-lg p-6 border border-gray-200">
        <textarea
          className="w-full h-40 p-4 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Paste your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        ></textarea>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`mt-4 text-white px-6 py-2 rounded-lg w-full flex justify-center items-center ${loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"}`}
        >
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Generate URL"}
        </button>

        {/* Generated Link, Code, and QR Code */}
        {generatedUrl && (
          <div className="mt-4 bg-gray-100 p-4 rounded-lg">
            <p className="text-gray-700">Share this link:</p>
            <div className="flex justify-between items-center">
              <input type="text" value={generatedUrl} readOnly className="w-full bg-transparent" />
              <button
                onClick={() => { alert("Copied to clipboard!"); navigator.clipboard.writeText(generatedUrl) }}
                className="ml-2 bg-blue-500 text-white px-4 py-1 rounded-lg hover:bg-blue-600"
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-gray-700">Or use this code: <strong>{generatedCode}</strong></p>
            {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="mt-4 w-40 mx-auto" />}
          </div>
        )}
      </div>

      {/* Retrieve Section */}
      <div className="w-full max-w-3xl bg-white shadow-lg rounded-lg p-6 border border-gray-200 mt-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Retrieve Clipboard Data</h2>
        <input
          type="text"
          placeholder="Enter your code"
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
        />
        <button
          onClick={handleRetrieve}
          className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 w-full"
        >
          <Search className="inline-block mr-2" /> Retrieve
        </button>
        {retrievedText && (
          <div className="mt-4 bg-gray-100 p-4 rounded-lg">
            <p className="text-gray-700">Retrieved Text:</p>

            <div className="p-3 bg-white border border-gray-300 rounded-md flex justify-between items-center">
              <span className="break-all">{retrievedText}</span>
              {
                retrievedText &&
                <button
                  onClick={() => { alert("Copied to clipboard!"); navigator.clipboard.writeText(retrievedText) }}
                  className="ml-2 bg-blue-500 text-white px-4 py-1 rounded-lg hover:bg-blue-600 flex items-center"
                >
                  <Copy className="h-5 w-5" />
                </button>
              }
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
