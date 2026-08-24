import './ReviewsPage.css';

function ReviewsPage({ reviews }) {
  return (
    <div className="page-section reviews-page">
      <section className="panel-card">
        <div className="card-header">
          <h3>Customer Reviews</h3>
          <button className="mini-button">Filter</button>
        </div>
        <div className="list-stack large">
          {reviews.map((review) => (
            <div key={review.id} className="review-item">
              <div className="review-header">
                <strong>{review.user}</strong>
                <span>{'⭐'.repeat(review.rating)}</span>
              </div>
              <p>{review.property}</p>
              <small>{review.comment}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ReviewsPage;
