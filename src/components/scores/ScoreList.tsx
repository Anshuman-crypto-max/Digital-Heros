'use client'

import { useState } from 'react'
import { Calendar, Edit2, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScoreForm } from './ScoreForm'
import { deleteScore } from '@/app/(dashboard)/dashboard/scores/actions'

type Score = {
  id: string
  score: number
  score_date: string
  created_at: string
}

export function ScoreList({ scores }: { scores: Score[] }) {
  const [editingScore, setEditingScore] = useState<Score | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this score?')) {
      setIsDeleting(id)
      await deleteScore(id)
      setIsDeleting(null)
    }
  }

  if (scores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-12">
        <Calendar className="mb-4 h-8 w-8 text-gray-400" />
        <h3 className="text-sm font-medium text-gray-900">No scores yet</h3>
        <p className="mt-1 text-sm text-gray-500">Add your first golf score to start tracking.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {scores.map((score) => (
        <div 
          key={score.id} 
          className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-500">
              {new Date(score.score_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{score.score}</span>
              <span className="text-sm font-medium text-gray-500">pts</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingScore(score)}
              className="text-gray-400 hover:text-gray-900"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={isDeleting === score.id}
              onClick={() => handleDelete(score.id)}
              className="text-gray-400 hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      {/* Edit Modal Overlay */}
      {editingScore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Edit Score</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setEditingScore(null)}
                className="text-gray-400 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <ScoreForm 
              key={editingScore.id}
              initialData={editingScore} 
              onSuccess={() => setEditingScore(null)} 
            />
          </div>
        </div>
      )}
    </div>
  )
}
