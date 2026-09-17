import './ReviewsPage.css';
import { useEffect, useState } from 'react';
import { apiService } from '../services/api';

function ReviewsPage({ appData, setAppData, notify }) {
  const [reviews, setReviews] = useState(appData.reviews || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiService.request('/reviews');
        if (res?.success) {
          const items = Array.isArray(res.data) ? res.data : [];
          setReviews(items);
          setAppData((prev) => ({ ...prev, reviews: items }));
        }
      } catch (err) {
        console.error('Failed to load reviews:', err);
        notify && notify({ message: err?.message || 'Unable to load reviews.', variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [setAppData, notify]);

  return (
    <div className="page-section reviews-page">
      <section className="panel-card">
        <div className="card-header">
          <h3>Customer Reviews</h3>
          <button className="mini-button">Filter</button>
        </div>
        <div className="list-stack large">
          {(!loading && reviews.length === 0) && <div className="empty">No reviews</div>}
          {reviews.map((review) => (
            <div key={review._id || review.id} className="review-item">
              <div className="review-header">
                <strong>{review.userName || review.user || 'Anonymous'}</strong>
                <span>{'⭐'.repeat(Number(review.rating || 0))}</span>
              </div>
              <p>{review.propertyName || review.property || ''}</p>
              <small>{review.comment || ''}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ReviewsPage;
