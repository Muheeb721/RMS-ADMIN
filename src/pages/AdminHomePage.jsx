import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './AdminHomePage.css';
import Modal from '../components/Modal';
import { apiService } from '../services/api';
import {
  deleteAdminProperty,
  deletePropertyImage,
  replacePropertyImage,
  updateAdminProperty,
  uploadPropertyImage,
} from '../services/adminPropertyService';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80';
const BACKEND_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
const HOME_VIP_HOUSES = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1200&q=80',
];

const HOME_FLATS_INTERIOR = [
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1502005229762-ee1b2b93e0f5?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80',
];

const HOME_APARTMENTS_BUILDINGS = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1502005096674-719299666c97?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
];

const normalizeImageUrl = (value) => {
  if (!value || typeof value !== 'string') return FALLBACK_IMAGE;
  const trimmed = value.trim();
  if (!trimmed) return FALLBACK_IMAGE;
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || /^(https?:)?\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return `${BACKEND_BASE_URL}${trimmed}`;
  }
  return trimmed;
};

const getPropertyId = (property) => property?._id || property?.id || property?.propertyId || property?.mongoId;

const normalizePropertyType = (property) => String(property?.propertyType || property?.type || property?.category || 'House').trim();

const getSectionImagePool = (sectionTitle = '') => {
  if (sectionTitle === 'Houses') return HOME_VIP_HOUSES;
  if (sectionTitle === 'Apartments') return HOME_APARTMENTS_BUILDINGS;
  if (sectionTitle === 'Flats') return HOME_FLATS_INTERIOR;
  return [];
};

const getSectionImageForCard = (sectionTitle, cardIndex, imageIndex) => {
  const pool = getSectionImagePool(sectionTitle);
  if (!pool.length) return FALLBACK_IMAGE;
  const offset = ((cardIndex + 1) * (imageIndex + 1) + sectionTitle.length) % pool.length;
  return pool[offset];
};

const getPropertyImages = (property, sectionTitle = '', cardIndex = 0) => {
  const list = [];
  if (Array.isArray(property?.images) && property.images.length) {
    property.images.forEach((item) => item && list.push(normalizeImageUrl(item)));
  }
  if (property?.image) list.push(normalizeImageUrl(property.image));

  const sectionPool = getSectionImagePool(sectionTitle);
  if (sectionPool.length) {
    for (let imageIndex = 0; imageIndex < 3; imageIndex += 1) {
      const fallback = getSectionImageForCard(sectionTitle, cardIndex, imageIndex);
      if (fallback && !list.includes(fallback)) {
        list.push(fallback);
      }
    }
  }

  const deduped = [...new Set(list.filter(Boolean))];
  if (!deduped.length) deduped.push(FALLBACK_IMAGE);
  while (deduped.length < 3) {
    const nextFallback = getSectionImageForCard(sectionTitle, cardIndex, deduped.length) || FALLBACK_IMAGE;
    if (!deduped.includes(nextFallback)) deduped.push(nextFallback);
    else deduped.push(FALLBACK_IMAGE);
  }
  return deduped.slice(0, 3);
};

const heroStats = [
  { label: 'Verified listings', value: '2.4K+' },
  { label: 'Happy residents', value: '1.8K+' },
  { label: 'Avg. response time', value: '< 15 min' },
];

const whyChoose = [
  { icon: '✅', title: 'Verified listings', text: 'All homes and rentals are checked for completeness, quality, and pricing accuracy.' },
  { icon: '🏡', title: 'Smart property management', text: 'Track ownership, availability, and updates in one admin-friendly dashboard.' },
  { icon: '🛠️', title: 'Fast support workflow', text: 'Resolve maintenance and booking requests without leaving the property portfolio.' },
];

const steps = [
  { title: 'Curate listings', text: 'Review each property card, update pricing, and map the right visuals to the right market.' },
  { title: 'Manage availability', text: 'Adjust status instantly to match rent, sale, or reserved conditions across the catalog.' },
  { title: 'Serve residents faster', text: 'Keep images, details, and pricing in sync so the user side always reflects the latest admin edits.' },
];

function AdminHomePage({ appData, setAppData, notify }) {
  const properties = appData?.properties || [];
  const fileInputRefs = useRef({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingProperty, setEditingProperty] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    location: '',
    city: '',
    description: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    status: 'Available',
  });

  const refreshProperties = async () => {
    try {
      const response = await apiService.request('/admin/properties');
      if (response?.success) {
        setAppData((prev) => ({ ...prev, properties: response.data || prev.properties || [] }));
      }
    } catch (error) {
      console.warn('Unable to refresh admin home properties:', error);
    }
  };

  const categories = useMemo(() => {
    const house = properties.filter((property) => {
      const type = normalizePropertyType(property).toLowerCase();
      return type === 'house' || type === 'houses';
    });

    const apartments = properties.filter((property) => {
      const type = normalizePropertyType(property).toLowerCase();
      return type === 'apartment' || type === 'apartments';
    });

    const flats = properties.filter((property) => {
      const type = normalizePropertyType(property).toLowerCase();
      return type === 'flat' || type === 'flats';
    });

    return [
      { title: 'Houses', items: house.slice(0, 3), accent: '#d97706', badge: 'FEATURED' },
      { title: 'Apartments', items: apartments.slice(0, 3), accent: '#0ea5e9', badge: 'FEATURED' },
      { title: 'Flats', items: flats.slice(0, 3), accent: '#14b8a6', badge: 'FOR RENT' },
    ];
  }, [properties]);

  const handleImageSelection = async (property, imageIndex, file) => {
    if (!file) return;
    try {
      const currentImages = getPropertyImages(property);
      if (currentImages.length > imageIndex) {
        await replacePropertyImage(getPropertyId(property), imageIndex, file);
      } else {
        await uploadPropertyImage(getPropertyId(property), file);
      }
      await refreshProperties();
      notify({ message: 'Image updated successfully.', variant: 'success' });
    } catch (error) {
      console.error('Image update failed:', error);
      notify({ message: error?.message || 'Unable to update image.', variant: 'error' });
    }
  };

  const handleDeleteImage = async (property, imageIndex) => {
    try {
      await deletePropertyImage(getPropertyId(property), imageIndex);
      await refreshProperties();
      notify({ message: 'Image deleted.', variant: 'success' });
    } catch (error) {
      console.error('Delete image failed:', error);
      notify({ message: error?.message || 'Unable to delete image.', variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAdminProperty(getPropertyId(deleteTarget));
      await refreshProperties();
      setDeleteTarget(null);
      notify({ message: 'Property deleted successfully.', variant: 'success' });
    } catch (error) {
      console.error('Property deletion failed:', error);
      notify({ message: error?.message || 'Unable to delete property.', variant: 'error' });
    }
  };

  const openEditModal = (property) => {
    setEditingProperty(property);
    setEditForm({
      title: property?.title || '',
      location: property?.location || property?.address || '',
      city: property?.city || '',
      description: property?.description || '',
      price: property?.price || property?.salePrice || '',
      bedrooms: property?.bedrooms || '',
      bathrooms: property?.bathrooms || '',
      area: property?.area || '',
      status: property?.status || 'Available',
    });
  };

  const saveEdit = async () => {
    if (!editingProperty) return;
    try {
      const existingImages = Array.isArray(editingProperty?.images) && editingProperty.images.length
        ? editingProperty.images.map((i) => normalizeImageUrl(i)).filter(Boolean)
        : (editingProperty?.image ? [normalizeImageUrl(editingProperty.image)] : []);

      const payload = {
        title: editForm.title,
        location: editForm.location,
        city: editForm.city,
        description: editForm.description,
        price: Number(editForm.price || 0),
        bedrooms: Number(editForm.bedrooms || 0),
        bathrooms: Number(editForm.bathrooms || 0),
        area: Number(editForm.area || 0),
        status: editForm.status,
        image: existingImages[0] || '',
        images: existingImages,
      };

      await updateAdminProperty(getPropertyId(editingProperty), payload);
      await refreshProperties();
      setEditingProperty(null);
      notify({ message: 'Property updated successfully.', variant: 'success' });
    } catch (error) {
      console.error('Property update failed:', error);
      notify({ message: error?.message || 'Unable to update property.', variant: 'error' });
    }
  };

  const triggerHiddenInput = (propertyId, index) => {
    const key = `${propertyId}-${index}`;
    fileInputRefs.current[key]?.click();
  };

  const renderPropertyCard = (property, sectionTitle, cardIndex = 0) => {
    const propertyId = getPropertyId(property);
    const images = getPropertyImages(property, sectionTitle, cardIndex);
    const primaryImage = images[0] || FALLBACK_IMAGE;
    const isRentSection = sectionTitle === 'Flats';
    const priceText = isRentSection ? 'Rent' : (property.price || property.salePrice || 'Contact');
    const tagColor = sectionTitle === 'Flats' ? '#14b8a6' : sectionTitle === 'Apartments' ? '#0ea5e9' : '#d97706';

    return (
      <article key={propertyId || property.title} className="admin-home-card property-card home-category-card">
        <div className="admin-home-visual">
          <img
            src={primaryImage}
            alt={property.title || 'Property image'}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
          <div className="admin-home-image-overlay">
            <button type="button" onClick={() => triggerHiddenInput(propertyId, 0)}>Replace</button>
            <button type="button" className="danger" onClick={() => handleDeleteImage(property, 0)}>Delete</button>
          </div>
          <input
            ref={(node) => {
              if (node) {
                fileInputRefs.current[`${propertyId}-0`] = node;
              }
            }}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              handleImageSelection(property, 0, file);
              event.target.value = '';
            }}
          />
        </div>

        <div className="card-body admin-home-card-body">
          <div className="card-top-row">
            <span className="admin-home-tag" style={{ background: tagColor }}>
              {sectionTitle === 'Flats' ? 'FOR RENT' : 'FEATURED'}
            </span>
            <span className="card-price">{priceText}</span>
          </div>
          <div className="card-title">{property.title}</div>
          <div className="card-address">{property.address || property.location || 'Property address'}</div>
          <div className="meta-row">
            <span className="meta-pill">{property.bedrooms || 0} beds</span>
            <span className="meta-pill">{property.bathrooms || 0} baths</span>
            <span className="meta-pill">{property.area || 'Area'}</span>
          </div>
          <div className="admin-home-actions">
            <button type="button" className="admin-home-ghost-button" onClick={() => setDeleteTarget(property)}>Delete</button>
            <button type="button" className="admin-main-button" onClick={() => openEditModal(property)}>Update</button>
          </div>
        </div>
      </article>
    );
  };

  const renderCategorySection = (category) => (
    <section className="hr-section home-category-section" key={category.title}>
      <div className="section-header">
        <div>
          <h3 className="section-title">{category.title}</h3>
          <p className="section-sub">Premium {category.title.toLowerCase()} listings with studio-grade controls.</p>
        </div>
        <Link to="/admin/properties" className="btn-ghost">View all</Link>
      </div>

      <div className="home-category-grid admin-home-category-grid">
        {(category.items && category.items.length ? category.items : []).map((property, index) => renderPropertyCard(property, category.title, index))}
      </div>
    </section>
  );

  return (
    <div className="page-shell home-shell admin-home-shell">
      <section className="hr-section hr-hero">
        <div className="hr-hero-inner">
          <div className="hr-hero-copy">
            <span className="hr-chip">Admin home control panel</span>
            <h1 className="hr-title">Manage the RMS property catalog from a single premium home view.</h1>
            <p className="hr-sub">Review every home, apartment, and flat listing. Replace media, update pricing, and publish changes instantly without leaving the homepage.</p>
            <div className="hr-cta">
              <Link to="/admin/properties" className="btn-primary">Open inventory</Link>
              <Link to="/admin/announcements" className="btn-secondary">Publish updates</Link>
            </div>
            <div className="hero-quick-stats">
              {heroStats.map((stat) => (
                <div key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hr-hero-image">
            <div className="hr-image" />
          </div>
        </div>
      </section>

      {categories.map(renderCategorySection)}

      <section className="hr-section">
        <div className="section-header">
          <div>
            <h3 className="section-title">Why Choose RMS</h3>
            <p className="section-sub">Built for smooth day-to-day operations and a better resident experience.</p>
          </div>
        </div>
        <div className="admin-home-benefits">
          {whyChoose.map((item) => (
            <div key={item.title} className="why-card">
              <div className="why-icon">{item.icon}</div>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="hr-section">
        <div className="section-header">
          <div>
            <h3 className="section-title">How it works</h3>
            <p className="section-sub">A simple admin workflow for listing health and property visibility.</p>
          </div>
        </div>
        <div className="admin-home-steps">
          {steps.map((step, index) => (
            <div key={step.title} className="step-card">
              <div className="step-index">{index + 1}</div>
              <div>
                <strong>{step.title}</strong>
                <p>{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="hr-footer">
        <div className="hr-footer-inner">
          <div>
            <strong>RMS Admin</strong>
            <p className="section-sub">Property operations, booking visibility, resident support, and catalog control in one place.</p>
          </div>
          <div className="hr-links">
            <Link to="/admin">Dashboard</Link>
            <Link to="/admin/properties">Properties</Link>
            <Link to="/admin/notifications">Notifications</Link>
          </div>
        </div>
      </footer>

      <Modal
        open={Boolean(deleteTarget)}
        title="Delete property"
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <button type="button" className="outline-button" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button type="button" className="primary-button danger-button" onClick={handleDelete}>Delete</button>
          </>
        }
      >
        <p>Are you sure you want to delete this property and all of its images? This action cannot be undone.</p>
      </Modal>

      <Modal
        open={Boolean(editingProperty)}
        title={`Update ${editingProperty?.title || 'property'}`}
        onClose={() => setEditingProperty(null)}
        footer={
          <>
            <button type="button" className="outline-button" onClick={() => setEditingProperty(null)}>Cancel</button>
            <button type="button" className="primary-button" onClick={saveEdit}>Save changes</button>
          </>
        }
      >
        <div className="property-form admin-home-form">
          <div className="form-grid two-col">
            <label>
              Title
              <input value={editForm.title} onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))} />
            </label>
            <label>
              Status
              <select value={editForm.status} onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value }))}>
                <option value="Available">Available</option>
                <option value="Reserved">Reserved</option>
                <option value="Sold">Sold</option>
                <option value="For Rent">For Rent</option>
              </select>
            </label>
          </div>

          <div className="form-grid two-col">
            <label>
              City
              <input value={editForm.city} onChange={(event) => setEditForm((prev) => ({ ...prev, city: event.target.value }))} />
            </label>
            <label>
              Location
              <input value={editForm.location} onChange={(event) => setEditForm((prev) => ({ ...prev, location: event.target.value }))} />
            </label>
          </div>

          <label>
            Description
            <textarea rows="4" value={editForm.description} onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))} />
          </label>

          <div className="form-grid three-col">
            <label>
              Price
              <input type="number" value={editForm.price} onChange={(event) => setEditForm((prev) => ({ ...prev, price: event.target.value }))} />
            </label>
            <label>
              Bedrooms
              <input type="number" value={editForm.bedrooms} onChange={(event) => setEditForm((prev) => ({ ...prev, bedrooms: event.target.value }))} />
            </label>
            <label>
              Bathrooms
              <input type="number" value={editForm.bathrooms} onChange={(event) => setEditForm((prev) => ({ ...prev, bathrooms: event.target.value }))} />
            </label>
          </div>

          <label>
            Area
            <input type="number" value={editForm.area} onChange={(event) => setEditForm((prev) => ({ ...prev, area: event.target.value }))} />
          </label>
        </div>
      </Modal>
    </div>
  );
}

export default AdminHomePage;
