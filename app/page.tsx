'use client';

import { useEffect, useState } from 'react';
import { Star, MessageSquare, X, Search, User, UserCheck, ImagePlus, Loader2, Heart, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Restaurant {
  place_id: string;
  name: string;
  vicinity: string;
  category?: string;
  averageRating?: number;
  reviewCount?: number;
}

interface Review {
  id: number;
  restaurant_id: string;
  rating: number;
  comment: string;
  user_name?: string;
  image_url?: string;
  created_at: string;
}

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Registration / User Identity State
  const [studentName, setStudentName] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [nameInput, setNameInput] = useState('');

  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Rating Modal state
  const [activeSpot, setActiveSpot] = useState<Restaurant | null>(null);
  const [selectedRating, setSelectedRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Reviews Viewer Modal state
  const [viewingSpot, setViewingSpot] = useState<Restaurant | null>(null);
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem('fue_student_name');
    if (savedName) {
      setStudentName(savedName);
    }
    fetchSpots();
  }, []);

  const fetchSpots = async () => {
    try {
      const res = await fetch('/api/restaurants');
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load places:', err);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    const cleanName = nameInput.trim();
    localStorage.setItem('fue_student_name', cleanName);
    setStudentName(cleanName);
    setShowRegisterModal(false);
  };

  const handleOpenReviews = async (spot: Restaurant) => {
    setViewingSpot(spot);
    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/reviews?restaurant_id=${encodeURIComponent(spot.place_id)}`);
      if (!res.ok) {
        setReviewsList([]);
        return;
      }
      const data = await res.json();
      setReviewsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
      setReviewsList([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleRateClick = (spot: Restaurant) => {
    if (!studentName) {
      setNameInput('');
      setShowRegisterModal(true);
      setActiveSpot(spot);
    } else {
      setActiveSpot(spot);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSpot) return;

    if (!studentName) {
      setShowRegisterModal(true);
      return;
    }

    setSubmitting(true);
    let imageUrl = '';

    try {
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `reviews/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('review-images')
          .upload(filePath, selectedFile);

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('review-images')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: activeSpot.place_id,
          rating: selectedRating,
          comment: comment,
          user_name: studentName,
          image_url: imageUrl,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitting(false);
        setSubmitSuccess(true);
        setTimeout(() => {
          setSubmitSuccess(false);
          setActiveSpot(null);
          setComment('');
          setSelectedRating(5);
          setSelectedFile(null);
          fetchSpots();
        }, 1800);
      } else {
        setSubmitting(false);
        alert(`Failed: ${data.error || 'Server error'}`);
      }
    } catch (err: any) {
      setSubmitting(false);
      alert(`Error: ${err.message}`);
    }
  };

  const categories = ['All', 'Cafe', 'Restaurant', 'Fast Food'];

  const filteredRestaurants = restaurants.filter((spot) => {
    const matchesSearch =
      spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spot.vicinity.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' ||
      (spot.category && spot.category.toLowerCase() === selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-[#FAF8F5] text-gray-800 p-6 flex flex-col justify-between selection:bg-red-900 selection:text-white">
      <div className="max-w-2xl mx-auto w-full flex-1">
        
        {/* Header & Registration Bar */}
        <div className="flex justify-between items-center mb-6 bg-white p-5 rounded-2xl shadow-sm border border-red-900/10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-900 inline-block"></span>
              <h1 className="text-2xl font-black tracking-tight text-red-950">CS Family Star ⭐</h1>
            </div>
            <p className="text-xs text-red-900/60 font-medium mt-0.5">Future University in Egypt Campus Food Guide</p>
          </div>
          <button
            onClick={() => {
              setNameInput(studentName);
              setShowRegisterModal(true);
            }}
            className="flex items-center space-x-1.5 bg-red-50 text-red-900 px-3.5 py-2 rounded-xl border border-red-200 text-xs font-bold hover:bg-red-100 transition-all duration-150 active:scale-95 shadow-sm"
          >
            {studentName ? (
              <>
                <UserCheck className="w-4 h-4 text-red-800" />
                <span>{studentName}</span>
              </>
            ) : (
              <>
                <User className="w-4 h-4 text-red-800" />
                <span>Register Student ID</span>
              </>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-900/40" />
          <input
            type="text"
            placeholder="Search food spots or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-red-900/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-900/30 shadow-sm transition-all"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 shadow-sm ${
                selectedCategory === cat
                  ? 'bg-red-900 text-white shadow-md shadow-red-900/20'
                  : 'bg-white text-red-950 border border-red-900/10 hover:bg-red-50/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-red-900" />
            <p className="text-xs font-semibold text-red-900/60">Loading spots near FUE...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRestaurants.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-red-900/10 p-6">
                <p className="text-sm font-medium text-gray-500">No spots found matching your filter.</p>
              </div>
            ) : (
              filteredRestaurants.map((spot) => (
                <div key={spot.place_id} className="bg-white p-5 rounded-2xl shadow-sm border border-red-900/10 hover:shadow-md transition-all duration-200 group">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-lg font-bold text-gray-900 group-hover:text-red-900 transition-colors">{spot.name}</h2>
                        {spot.category && (
                          <span className="text-[10px] font-bold bg-red-50 text-red-800 px-2.5 py-0.5 rounded-full border border-red-100">
                            {spot.category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{spot.vicinity}</p>
                    </div>
                    <div className="flex items-center space-x-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/60">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-xs text-amber-900">
                        {spot.averageRating && spot.averageRating > 0 ? spot.averageRating : 'New'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                    <button
                      onClick={() => handleOpenReviews(spot)}
                      className="text-xs font-bold text-gray-500 hover:text-red-900 flex items-center space-x-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-red-900/60" />
                      <span>{spot.reviewCount ? `${spot.reviewCount} review(s)` : '0 reviews'}</span>
                    </button>

                    <button 
                      onClick={() => handleRateClick(spot)}
                      className="bg-red-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-950 transition-all duration-150 active:scale-95 shadow-sm shadow-red-900/20"
                    >
                      Rate Spot
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Student Registration Modal */}
        {showRegisterModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-red-950/10">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-extrabold text-red-950">Student Portal</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Attach your name to your food reviews.</p>
                </div>
                <button onClick={() => setShowRegisterModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveRegistration} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Your Name / Student ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Omar CS, Youssef 2023049"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-900/30 focus:outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-red-900 text-white py-3 rounded-xl font-bold text-xs hover:bg-red-950 transition-all duration-150 active:scale-95 shadow-md shadow-red-900/20"
                >
                  Save & Continue
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Read Reviews Modal */}
        {viewingSpot && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col border border-red-950/10">
              <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">{viewingSpot.name}</h3>
                  <p className="text-xs font-semibold text-red-900">Student Reviews & Feedback</p>
                </div>
                <button 
                  onClick={() => setViewingSpot(null)}
                  className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 space-y-3 pr-1">
                {loadingReviews ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-red-900" />
                  </div>
                ) : reviewsList.length === 0 ? (
                  <p className="text-sm text-gray-400 italic text-center py-8">No student comments submitted yet. Be the first!</p>
                ) : (
                  reviewsList.map((rev) => (
                    <div key={rev.id} className="p-4 bg-[#FAF8F5] rounded-2xl border border-red-950/5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-red-900">
                          {rev.user_name || 'Anonymous Student'}
                        </span>
                        <div className="flex items-center space-x-1">
                          <div className="flex items-center space-x-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-gray-400 ml-2">
                            {new Date(rev.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      {rev.comment && (
                        <p className="text-sm text-gray-700 font-medium">{rev.comment}</p>
                      )}

                      {rev.image_url && (
                        <div className="mt-2 overflow-hidden rounded-xl border border-gray-200">
                          <img 
                            src={rev.image_url} 
                            alt="Food photo" 
                            className="w-full max-h-52 object-cover hover:scale-105 transition duration-300" 
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rate Spot Modal */}
        {activeSpot && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-red-950/10 relative overflow-hidden">
              {submitSuccess ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 animate-fadeIn">
                  <div className="w-12 h-12 bg-red-50 text-red-900 rounded-full flex items-center justify-center border border-red-200">
                    <CheckCircle2 className="w-7 h-7 text-red-900" />
                  </div>
                  <h3 className="text-xl font-extrabold text-red-950">Thank you, {studentName}!</h3>
                  <p className="text-xs text-gray-500 max-w-xs">
                    Your feedback for <span className="font-bold text-gray-800">{activeSpot.name}</span> has been successfully published.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-extrabold text-gray-900">Rate {activeSpot.name}</h3>
                      <p className="text-xs text-gray-500">{activeSpot.vicinity}</p>
                    </div>
                    <button 
                      onClick={() => {
                        setActiveSpot(null);
                        setSelectedFile(null);
                      }}
                      className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">Your Rating</label>
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setSelectedRating(star)}
                            className="p-1 focus:outline-none transition-transform hover:scale-110 active:scale-95"
                          >
                            <Star 
                              className={`w-8 h-8 ${star <= selectedRating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Comment (Optional)</label>
                      <textarea
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="What did you order? How was it?"
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-900/30 focus:outline-none transition-all"
                      />
                    </div>

                    {/* File Upload Input */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Food Photo (Optional)</label>
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center space-x-2 border border-gray-200 px-3.5 py-2.5 rounded-xl cursor-pointer hover:bg-red-50/30 transition w-full">
                          <ImagePlus className="w-4 h-4 text-red-900" />
                          <span className="text-xs text-gray-600 truncate font-medium">
                            {selectedFile ? selectedFile.name : 'Choose food photo...'}
                          </span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                            className="hidden" 
                          />
                        </label>
                        {selectedFile && (
                          <button
                            type="button"
                            onClick={() => setSelectedFile(null)}
                            className="text-gray-400 hover:text-red-900 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSpot(null);
                          setSelectedFile(null);
                        }}
                        className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-xs hover:bg-gray-50 transition-all duration-150 active:scale-95"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 bg-red-900 text-white py-3 rounded-xl font-bold text-xs hover:bg-red-950 disabled:opacity-50 flex items-center justify-center space-x-1.5 transition-all duration-150 active:scale-95 shadow-md shadow-red-900/20"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <span>Submit</span>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Credits */}
      <footer className="mt-12 pt-6 border-t border-red-950/10 text-center">
        <p className="text-xs text-red-950/60 font-medium flex items-center justify-center space-x-1">
          <span>Crafted with</span>
          <Heart className="w-3 h-3 text-red-900 fill-red-900 inline" />
          <span>by <strong className="text-red-950 font-bold">Youssef Ahmed</strong> & <strong className="text-red-950 font-bold">Ahmed Abdelwahab</strong></span>
        </p>
      </footer>
    </main>
  );
}