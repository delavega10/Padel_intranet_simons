export function SetupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <div className="max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 uppercase">Supabase mangler</h1>
        <p className="mt-3 text-sm text-gray-600 normal-case">
          Opret en <code className="text-padel-600 font-mono text-xs">.env</code> fil i projektroden med:
        </p>
        <pre className="mt-4 rounded-lg bg-gray-50 border border-gray-100 p-4 text-left text-xs text-gray-700">
{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=din-anon-key`}
        </pre>
        <p className="mt-4 text-xs text-gray-500 normal-case">Se README.md for fuld opsætningsguide.</p>
      </div>
    </div>
  )
}
