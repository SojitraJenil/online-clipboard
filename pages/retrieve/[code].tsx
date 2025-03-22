import { useEffect, useState } from "react"
import { useParams } from "next/navigation" // Use useParams instead of useSearchParams
import { Loader2, Copy, Check, ArrowLeft } from "lucide-react"
import { db } from "@/firebase"
import { collection, getDocs, query, where, type Timestamp } from "firebase/firestore"
import Link from "next/link"

interface ClipboardData {
    text: string
    imageUrl?: string
    code: string
    createdAt: Timestamp | Date
}

export default function RetrievePage() {
    const { code } = useParams() ?? {};

    const [retrievedData, setRetrievedData] = useState<ClipboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!code) return; // Avoid unnecessary fetch when `code` is missing

        const fetchData = async () => {
            setLoading(true);
            setError("");
            try {
                console.log("Fetching data for code:", code);
                const q = query(collection(db, "clipboards"), where("code", "==", code));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    setRetrievedData(querySnapshot.docs[0].data() as ClipboardData);
                } else {
                    setError("No data found for this code");
                }
            } catch (error) {
                console.error("Error retrieving data:", error);
                setError(`Failed to retrieve data: ${error instanceof Error ? error.message : String(error)}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [code]);

    const handleCopy = () => {
        if (retrievedData?.text) {
            navigator.clipboard.writeText(retrievedData.text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100">
            <div className="p-4">
                <Link href="/" className="flex items-center text-indigo-600 hover:underline">
                    <ArrowLeft className="h-5 w-5 mr-2" /> Back
                </Link>
            </div>
            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-screen">
                    <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-800">Loading clipboard data...</h2>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center min-h-screen">
                    <div className="bg-red-100 text-red-600 p-4 rounded-lg mb-4">
                        <p>{error}</p>
                    </div>
                    <Link href="/" className="bg-indigo-600 text-white px-4 py-2 rounded-lg">Back to Home</Link>
                </div>
            ) : (
                <main className="container mx-auto px-4 py-8">
                    <h1 className="text-2xl font-bold">Retrieved Clipboard</h1>
                    <p>Code: {code}</p>
                    {retrievedData?.text && (
                        <div className="bg-gray-100 p-4 rounded-lg mt-4 flex justify-between items-center">
                            <p>{retrievedData.text}</p>
                            <button onClick={handleCopy} className="ml-4 p-2 bg-indigo-600 text-white rounded-lg flex items-center">
                                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                            </button>
                        </div>
                    )}
                </main>
            )}
        </div>
    )
}
