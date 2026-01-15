export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-white mb-4">
        FieldDeskOps is <span className="text-[#FF6700]">Back Online</span>
      </h1>
      <p className="text-xl text-gray-400 mb-8">
        We're rebuilding your apps. Check back soon!
      </p>
      <a 
        href="/dashboard" 
        className="inline-block bg-[#FF6700] text-white font-bold py-3 px-8 rounded-lg hover:bg-[#e55c00]"
      >
        Go to Dashboard
      </a>
    </div>
  )
}
