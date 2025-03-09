import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db } from "@/firebase"; // Ensure Firebase is properly initialized
import { doc, getDoc } from "firebase/firestore";

export default function RetrievePage() {
    const router = useRouter();
    const { id } = router.query; // Get the document ID from URL
    const [text, setText] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchText = async () => {
            const docRef = doc(db, "clipboards", id as string);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setText(docSnap.data().text);
            } else {
                setText("No data found.");
            }
        };

        fetchText();
    }, [id]);

    const handleCopy = () => {
        if (text) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    console.log("Text copied:", text); // Debugging
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                })
                .catch(err => console.error("Copy failed", err));
        }
    };
    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="p-6 bg-white shadow-lg rounded-lg max-w-lg text-center">
                <p className="text-lg text-gray-800 mb-4">{text || "Loading..."}</p>
                {text && (
                    <button
                        onClick={handleCopy}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        {copied ? "Copied!" : "Copy"}
                    </button>
                )}
            </div>
        </main>
    );
}
