interface CountCardProps {
  label: string
  count: number
  color: string
}

const colorMap: Record<string, string> = {
  gray: 'bg-gray-100 text-gray-800 border-gray-300',
  blue: 'bg-blue-100 text-blue-800 border-blue-300',
  green: 'bg-green-100 text-green-800 border-green-300',
  red: 'bg-red-100 text-red-800 border-red-300',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
}

export default function CountCard({ label, count, color }: CountCardProps) {
  return (
    <div className={`rounded-lg border p-4 text-center ${colorMap[color] || colorMap.gray}`}>
      <div className="text-3xl font-bold">{count}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
    </div>
  )
}
