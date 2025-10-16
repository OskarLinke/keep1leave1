'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

interface Ranking {
  word: string;
  wins: number;
  losses: number;
  win_rate: number;
  times_shown: number;
}

const API_BASE = 'http://localhost:8000';

export default function Rankings() {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRankings = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/rankings`);
      setRankings(response.data);
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading rankings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Rankings</h1>
            <p className="text-gray-600 mt-2">See what people most want to keep</p>
          </div>
          <Link
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition-colors shadow-lg"
          >
            Back to Game
          </Link>
        </div>

        {/* Rankings Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-pink-500 to-purple-500">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Word
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Wins
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Losses
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Win Rate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Times Shown
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rankings.map((ranking, index) => (
                  <tr 
                    key={ranking.word} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-50 text-gray-600'
                        } font-semibold text-sm`}>
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-semibold text-gray-900">
                        {ranking.word}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {ranking.wins}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {ranking.losses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-semibold text-gray-900 mr-2">
                          {(ranking.win_rate * 100).toFixed(1)}%
                        </span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full"
                            style={{ width: `${ranking.win_rate * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ranking.times_shown}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rankings.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-4">No rankings available yet</div>
              <Link
                href="/"
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition-colors"
              >
                Start Playing to Generate Rankings
              </Link>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        {rankings.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-lg text-center">
              <div className="text-2xl font-bold text-pink-600">{rankings.length}</div>
              <div className="text-gray-600">Total Words</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {rankings.reduce((total, word) => total + word.times_shown, 0)}
              </div>
              <div className="text-gray-600">Total Votes</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-lg text-center">
              <div className="text-2xl font-bold text-gray-800">
                {rankings[0]?.word || 'None'}
              </div>
              <div className="text-gray-600">Current Champion</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
