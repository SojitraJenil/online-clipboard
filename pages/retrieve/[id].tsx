import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db } from "@/firebase"; // Ensure Firebase is properly initialized
import { doc, getDoc } from "firebase/firestore";

export default function RetrievePage() {
    const router = useRouter();
    const { id } = router.query; // Get the document ID from URL
    const [text, setText] = useState<string | null>(null);

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

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="p-6 bg-white shadow-lg rounded-lg max-w-lg">
                <p className="text-lg text-gray-800">{text || "Loading..."}</p>
            </div>
        </main>
    );
}
