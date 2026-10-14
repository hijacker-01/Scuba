'use client';
import { useState } from 'react';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section id="contact" className="contact">
      <div className="container">
        <div className="contact-grid">
          <div className="contact-info">
            <h3>Get In Touch</h3>
            <p>
              Have questions about our courses or want to book a dive? Reach out to us and our team will get back to you within 24 hours.
            </p>
            <div className="contact-detail">
              <div className="contact-detail-icon"><i className="fas fa-map-marker-alt"></i></div>
              <div className="contact-detail-text">
                <h4>Location</h4>
                <p>Havelock Island, South Andaman, Andaman & Nicobar Islands</p>
              </div>
            </div>
            <div className="contact-detail">
              <div className="contact-detail-icon"><i className="fas fa-phone-alt"></i></div>
              <div className="contact-detail-text">
                <h4>Phone</h4>
                <p>+91 98765 43210</p>
              </div>
            </div>
            <div className="contact-detail">
              <div className="contact-detail-icon"><i className="fas fa-envelope"></i></div>
              <div className="contact-detail-text">
                <h4>Email</h4>
                <p>info@havelockdiveclub.com</p>
              </div>
            </div>
          </div>
          <form className="contact-form" onSubmit={handleSubmit}>
            {submitted && (
              <div style={{ padding: '12px', background: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
                Message sent successfully! We will get back to you soon.
              </div>
            )}
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" placeholder="Your Name" required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="your@email.com" required />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" placeholder="+91XXXXXXXXXX" />
            </div>
            <div className="form-group">
              <label>Service</label>
              <select>
                <option value="">Select a course</option>
                <option>Open Water Diver</option>
                <option>Advanced Open Water</option>
                <option>Rescue Diver</option>
                <option>Dive Master</option>
                <option>Group Booking</option>
              </select>
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea placeholder="Tell us about your plans..." required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Send Message</button>
          </form>
        </div>
      </div>
    </section>
  );
}
