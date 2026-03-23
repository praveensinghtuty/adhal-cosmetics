"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Review = {
  id: string;
  name: string;
  rating: number;
  comment: string;
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    setReviews(data || []);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const addReview = async () => {
    if (!name || !comment) return;

    await supabase.from("reviews").insert([{ name, rating, comment }]);

    setName("");
    setComment("");
    setRating(5);

    fetchReviews();
  };

  return (
    <div className="reviews-page">
      <h1>Customer Reviews</h1>

      {/* Add Review */}
      <div className="review-form">
        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="star-row">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`star ${star <= rating ? "active" : ""}`}
              onClick={() => setRating(star)}
            >
              ★
            </span>
          ))}
        </div>

        <textarea
          placeholder="Your review"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <button onClick={addReview}>Submit Review</button>
      </div>

      {/* Reviews List */}
      <div className="reviews-list">
        {reviews.map((r) => (
          <div key={r.id} className="review-card">
            <div className="review-head">
              <strong>{r.name}</strong>
              <span>{"⭐".repeat(r.rating)}</span>
            </div>
            <p>{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
