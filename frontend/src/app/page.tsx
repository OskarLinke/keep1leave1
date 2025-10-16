'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

interface WordPair {
  word1: string;
  word1_id: number;
  word2: string;
  word2_id: number;
}

interface VoteResponse {
  message: string;
  winner: string;
  loser: string;
  next_opponent?: {
    word: string;
    id: number;
  };
}

const API_BASE = 'http://localhost:8000';

export default function Home() {
  const [wordPair, setWordPair] = useState<WordPair | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [eliminatedWordIds, setEliminatedWordIds] = useState<Set<number>>(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [finalWinner, setFinalWinner] = useState('');

  // Fetch initial word pair
  const fetchWordPair = async () => {
    try {
      setLoading(true);
      setGameOver(false);
      setEliminatedWordIds(new Set());
      setFinalWinner('');
      setMessage('');
      const response = await axios.get(`${API_BASE}/api/word-pair`);
      setWordPair(response.data);
    } catch (error) {
      console.error('Error fetching word pair:', error);
      setMessage('Error loading words. Make sure the backend is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };



  // Vote for a word
  const vote = async (winnerId: number, loserId: number, winnerWasLeft: boolean) => {
    try {
      setLoading(true);   

      
      // Add loser to eliminated words immediately
      const newEliminatedIds = new Set(eliminatedWordIds);
      newEliminatedIds.add(loserId);
      setEliminatedWordIds(newEliminatedIds);

      // Send vote to backend
      const response = await axios.post(`${API_BASE}/api/vote`, {
        winner_id: winnerId,
        loser_id: loserId,
      });

      const nextOpponent = await axios.get(`${API_BASE}/api/next-opponent`, {
  params: {
    winner_id: winnerId,
    loser_id: loserId 
  }
});

console.log(nextOpponent.data);
      if (nextOpponent) {
      console.log("there is a next opponent");
      console.log(nextOpponent.data.word);
      console.log(nextOpponent.data.word_id);
        // Update the word pair with winner and new opponent
        const newWordPair = {
          word1: winnerWasLeft ? response.data.winner : nextOpponent.data.word,
          word1_id: winnerWasLeft ? winnerId : nextOpponent.data.word_id,
          word2: winnerWasLeft ? nextOpponent.data.word : response.data.winner,
          word2_id: winnerWasLeft ? nextOpponent.data.word_id : winnerId,
        };
        setWordPair(newWordPair);
      } else {
        // No more opponents - game over!
        setFinalWinner(response.data.winner);
        setGameOver(true);
        setWordPair(null);
      }
    } catch (error: any) {
      console.error('Error voting:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load initial word pair
  useEffect(() => {
    fetchWordPair();
  }, []);

  if (loading && !wordPair && !gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading words...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Keep 1 Leave 1
          </h1>
          <p className="text-gray-600">
            Choose one to keep forever. The other is gone.
          </p>
        </div>

        {/* Error Message Display Only */}
        {message && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg text-center">
            {message}
          </div>
        )}

        {/* Game Over Screen */}
        {gameOver && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              🏆 Game Complete!
            </h2>
            <p className="text-xl text-gray-600 mb-6">
              It seems <span className="font-bold text-purple-600">{finalWinner}</span> is the most important thing to you.
            </p>
            <button
              onClick={fetchWordPair}
              className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl text-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition-all duration-200 shadow-lg"
            >
              Play Again
            </button>
          </div>
        )}

        {/* Voting Interface */}
        {!gameOver && wordPair ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-center mb-8 text-gray-700">
              Choose one to keep, the other is gone forever
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Button */}
              <button
                onClick={() => vote(wordPair.word1_id, wordPair.word2_id, true)}
                disabled={loading}
                className="p-8 bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-xl text-2xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-lg"
              >
                {wordPair.word1}
              </button>

              {/* Right Button */}
              <button
                onClick={() => vote(wordPair.word2_id, wordPair.word1_id, false)}
                disabled={loading}
                className="p-8 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl text-2xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-lg"
              >
                {wordPair.word2}
              </button>
            </div>

            {loading && (
              <div className="text-center mt-6 text-gray-500">
                Finding your next choice...
              </div>
            )}
          </div>
        ) : !gameOver ? (
          <div className="text-center bg-white rounded-2xl shadow-xl p-8">
            <p className="text-lg text-gray-600 mb-6">Ready to begin your journey?</p>
            <button
              onClick={fetchWordPair}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl text-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition-colors disabled:opacity-50 shadow-lg"
            >
              {loading ? 'Loading...' : 'Start Game'}
            </button>
          </div>
        ) : null}

        {/* Game Stats */}
        {!gameOver && wordPair && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Words eliminated: {eliminatedWordIds.size}</p>
          </div>
        )}

        {/* Rankings Link */}
        {!gameOver && (
          <div className="text-center mt-8">
            <Link
              href="/rankings"
              className="inline-block px-6 py-3 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors shadow-lg border border-gray-200"
            >
              View Rankings
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
