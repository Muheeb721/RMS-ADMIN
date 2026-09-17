import { useMemo, useState, useEffect } from 'react';
import './PropertiesPage.css';
import Modal from '../components/Modal';
import { formatCurrency, formatDate } from '../utils/formatters';
import { generateId } from '../services/localStorage';
import { apiService } from '../services/api';
import { createAdminProperty, deleteAdminProperty, updateAdminProperty, uploadPropertyImage, deletePropertyImage } from '../services/adminPropertyService';

const emptyForm = {
  title: '',
  propertyType: 'House',
  category: 'House',
  description: '',
  price: '',
  rent: '',
  salePrice: '',
  deposit: '',
  otherCharges: '',
  location: '',
  city: '',
  address: '',
  bedrooms: '',
  bathrooms: '',
  area: '',
  furnished: 'Fully Furnished',
  floor: '',
  totalFloors: '',
  ownerName: '',
  ownerPhone: '',
  ownerEmail: '',
  image: '',
  status: 'Available',
};

const statusOptions = ['Available', 'Reserved', 'Sold', 'For Rent'];
const getPropertyId = (property) => property?._id || property?.id || property?.propertyId || property?.mongoId;

function PropertiesPage({ appData, setAppData, notify, defaultTypeFilter = 'All' }) {
  const properties = appData.properties || [];

  const refreshProperties = async () => {
    try {
      const resp = await apiService.request('/admin/properties');
      if (resp?.success) {
        setAppData((prev) => ({ ...prev, properties: resp.data || prev.properties || [] }));
      }
    } catch (error) {
      console.warn('Unable to refresh property list from backend:', error);
    }
  };
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(defaultTypeFilter || 'All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortKey, setSortKey] = useState('createdAt');
  const [modalOpen, setModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const filteredProperties = useMemo(() => {
    const next = [...properties].filter((item) => {
      const matchesSearch = !search || [item.title, item.location, item.ownerName, item.city].join(' ').toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'All' || item.propertyType === typeFilter;
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });

    next.sort((a, b) => {
      if (sortKey === 'price') return Number(b.price || 0) - Number(a.price || 0);
      if (sortKey === 'title') return String(a.title).localeCompare(String(b.title));
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return next;
  }, [properties, search, typeFilter, statusFilter, sortKey]);

  const inventoryStats = useMemo(() => {
    const totalValue = properties.reduce((sum, item) => sum + Number(item.price || item.salePrice || 0), 0);
    const available = properties.filter((item) => String(item.status || '').toLowerCase() === 'available').length;
    const forRent = properties.filter((item) => String(item.status || '').toLowerCase() === 'for rent').length;
    const reserved = properties.filter((item) => String(item.status || '').toLowerCase() === 'reserved').length;

    return {
      total: properties.length,
      value: totalValue,
      available,
      forRent,
      reserved,
    };
  }, [properties]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const existing = (appData.properties || []).length;
        if (existing) return;
        const resp = await apiService.request('/admin/properties');
        if (resp?.success) setAppData((prev) => ({ ...prev, properties: resp.data || [] }));
      } catch (e) {
        console.warn('Load properties failed', e);
        notify && notify({ message: 'Unable to load properties', variant: 'error' });
      }
    };
    loadProperties();
  }, [setAppData]);

  const openEditModal = (property) => {
    setEditingId(getPropertyId(property));
    setFormData({
      title: property.title || '',
      propertyType: property.propertyType || 'House',
      category: property.category || property.propertyType || 'House',
      description: property.description || '',
      price: property.price || '',
      rent: property.rent || '',
      salePrice: property.salePrice || '',
      deposit: property.deposit || '',
      otherCharges: property.otherCharges || '',
      location: property.location || '',
      city: property.city || '',
      address: property.address || '',
      bedrooms: property.bedrooms || '',
      bathrooms: property.bathrooms || '',
      area: property.area || '',
      furnished: property.furnished || 'Fully Furnished',
      floor: property.floor || '',
      totalFloors: property.totalFloors || '',
      ownerName: property.ownerName || '',
      ownerPhone: property.ownerPhone || '',
      ownerEmail: property.ownerEmail || '',
      image: property.image || '',
      status: property.status || 'Available',
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImagePick = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, image: String(reader.result || ''), images: [String(reader.result || '')] }));
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.title.trim()) nextErrors.title = 'Title is required';
    if (!formData.city.trim()) nextErrors.city = 'City is required';
    if (!formData.location.trim()) nextErrors.location = 'Location is required';
    if (!formData.ownerName.trim()) nextErrors.ownerName = 'Owner name is required';
    if (!formData.ownerPhone.trim()) nextErrors.ownerPhone = 'Owner phone is required';
    if (!formData.ownerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail)) nextErrors.ownerEmail = 'Valid email is required';
    if (!formData.price || Number(formData.price) <= 0) nextErrors.price = 'Price must be greater than zero';
    if (!formData.area || Number(formData.area) <= 0) nextErrors.area = 'Area must be greater than zero';
    return nextErrors;
  };

  const addActivity = (action, details) => {
    setAppData((prev) => ({
      ...prev,
      activityLogs: [{ id: `log-${Date.now()}`, action, details, timestamp: new Date().toISOString() }, ...(prev.activityLogs || [])].slice(0, 20),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const previousProperty = editingId ? properties.find((item) => String(getPropertyId(item)) === String(editingId)) : null;
    const nextPriceHistory = previousProperty?.priceHistory || [];

    if (editingId && previousProperty) {
      const prevPrice = Number(previousProperty.price || 0);
      const nextPrice = Number(formData.price || 0);
      if (prevPrice !== nextPrice) {
        nextPriceHistory.unshift({
          historyId: `hist-${Date.now()}`,
          propertyId: getPropertyId(previousProperty),
          oldPrice: prevPrice,
          newPrice: nextPrice,
          changedBy: 'Admin',
          changedAt: new Date().toISOString(),
        });
      }
    }

    const payload = {
      title: formData.title.trim(),
      propertyType: formData.propertyType,
      category: formData.category || formData.propertyType,
      description: formData.description.trim(),
      price: Number(formData.price || 0),
      rent: Number(formData.rent || 0),
      salePrice: Number(formData.salePrice || formData.price || 0),
      deposit: Number(formData.deposit || 0),
      otherCharges: Number(formData.otherCharges || 0),
      location: formData.location.trim(),
      city: formData.city.trim(),
      address: formData.address.trim(),
      bedrooms: Number(formData.bedrooms || 0),
      bathrooms: Number(formData.bathrooms || 0),
      area: Number(formData.area || 0),
      furnished: formData.furnished,
      floor: Number(formData.floor || 0),
      totalFloors: Number(formData.totalFloors || 0),
      ownerName: formData.ownerName.trim(),
      ownerPhone: formData.ownerPhone.trim(),
      ownerEmail: formData.ownerEmail.trim(),
      image: formData.image || 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80',
      images: formData.images || [formData.image || 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80'],
      status: formData.status,
      createdAt: editingId ? previousProperty?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      priceHistory: nextPriceHistory,
    };

    try {
      const saved = editingId
        ? await updateAdminProperty(editingId, payload)
        : await createAdminProperty(payload);

      const finalProperty = saved || payload;

      await refreshProperties();

      setAppData((prev) => ({
        ...prev,
        notifications: [
          {
            id: `notif-${Date.now()}`,
            title: editingId ? 'Property updated' : 'New property submission',
            message: `${(finalProperty.title || payload.title)} (${finalProperty.propertyType || payload.propertyType}) was ${editingId ? 'updated' : 'added'}.`,
            propertyId: getPropertyId(finalProperty) || editingId,
            propertyType: finalProperty.propertyType || payload.propertyType,
            time: 'Just now',
            date: new Date().toISOString(),
            read: false,
            priority: 'Normal',
          },
          ...(prev.notifications || []),
        ],
      }));

      addActivity(editingId ? 'Property edited' : 'Property added', `${finalProperty.title || payload.title} was ${editingId ? 'updated' : 'added'} in the catalog.`);
      notify({ message: editingId ? 'Property updated successfully.' : 'Property added successfully.', variant: 'success' });
      setModalOpen(false);
      setEditingId(null);
      setFormData(emptyForm);
    } catch (error) {
      console.error('Admin property save failed:', error);
      notify({ message: error.message || 'Unable to save property.', variant: 'error' });
    }
  };

  const handleDelete = async (propertyId) => {
    try {
      await deleteAdminProperty(propertyId);
      await refreshProperties();
      addActivity('Property deleted', 'A property was removed from the catalog.');
      notify({ message: 'Property deleted successfully.', variant: 'success' });
    } catch (error) {
      console.error('Admin property delete failed:', error);
      notify({ message: error.message || 'Unable to delete property.', variant: 'error' });
    }
    setDeletingId(null);
  };

  const changeStatus = (propertyId, nextStatus) => {
    (async () => {
      try {
        notify({ message: 'Updating property status...', variant: 'info' });
        const resp = await apiService.request(`/properties/${propertyId}/status`, { method: 'POST', body: { status: nextStatus } });
        const updated = resp?.data || null;
        if (updated) {
          setAppData((prev) => ({ ...prev, properties: (prev.properties || []).map((p) => (String(getPropertyId(p)) === String(propertyId) ? { ...p, ...updated } : p)) }));
        } else {
          setAppData((prev) => ({ ...prev, properties: (prev.properties || []).map((item) => (String(getPropertyId(item)) === String(propertyId) ? { ...item, status: nextStatus, updatedAt: new Date().toISOString() } : item)) }));
        }
        await refreshProperties();
        addActivity('Property status changed', `A property status was updated to ${nextStatus}.`);
        notify({ message: `Property status updated to ${nextStatus}.`, variant: 'success' });
      } catch (e) {
        console.error('Update status failed', e);
        notify({ message: e?.message || 'Unable to update property status.', variant: 'error' });
      }
    })();
  };

  const duplicateProperty = (property) => {
    (async () => {
      try {
        notify({ message: 'Duplicating property...', variant: 'info' });
        const payload = { ...property };
        delete payload._id;
        delete payload.id;
        payload.title = `${property.title} Copy`;
        payload.createdAt = new Date().toISOString();
        payload.updatedAt = new Date().toISOString();
        const saved = await createAdminProperty(payload);
        const finalProperty = saved || { ...payload, _id: payload._id || generateId('prop') };
        await refreshProperties();
        setEditingId(getPropertyId(finalProperty) || null);
        setFormData({
          title: finalProperty.title || '',
          propertyType: finalProperty.propertyType || 'House',
          category: finalProperty.category || finalProperty.propertyType || 'House',
          description: finalProperty.description || '',
          price: finalProperty.price || '',
          rent: finalProperty.rent || '',
          salePrice: finalProperty.salePrice || '',
          deposit: finalProperty.deposit || '',
          otherCharges: finalProperty.otherCharges || '',
          location: finalProperty.location || '',
          city: finalProperty.city || '',
          address: finalProperty.address || '',
          bedrooms: finalProperty.bedrooms || '',
          bathrooms: finalProperty.bathrooms || '',
          area: finalProperty.area || '',
          furnished: finalProperty.furnished || 'Fully Furnished',
          floor: finalProperty.floor || '',
          totalFloors: finalProperty.totalFloors || '',
          ownerName: finalProperty.ownerName || '',
          ownerPhone: finalProperty.ownerPhone || '',
          ownerEmail: finalProperty.ownerEmail || '',
          image: finalProperty.image || '',
          status: finalProperty.status || 'Available',
        });
        setErrors({});
        setModalOpen(true);
        addActivity('Property duplicated', `${property.title} was duplicated and opened for editing.`);
        notify({ message: 'Property duplicated and opened for editing.', variant: 'success' });
      } catch (e) {
        console.error('Duplicate property failed', e);
        notify({ message: e?.message || 'Unable to duplicate property.', variant: 'error' });
      }
    })();
  };

  const handleUploadImageForSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedProperty) return;
    try {
      // client-side validation
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const MAX_BYTES = Number(import.meta.env.VITE_UPLOAD_MAX_SIZE || 5 * 1024 * 1024);
      if (!allowedTypes.includes(file.type)) {
        notify({ message: 'Invalid image type. Only JPG, PNG and WEBP are allowed.', variant: 'error' });
        return;
      }
      if (file.size && file.size > MAX_BYTES) {
        notify({ message: `Image too large. Maximum ${Math.round(MAX_BYTES / 1024 / 1024)}MB allowed.`, variant: 'error' });
        return;
      }

      notify({ message: 'Uploading image...', variant: 'info' });
      const result = await uploadPropertyImage(getPropertyId(selectedProperty), file);
      const updatedImages = result?.images || (result?.url ? [result.url, ...(selectedProperty.images || [])] : selectedProperty.images || []);
      const updated = { ...selectedProperty, images: updatedImages, image: updatedImages[0] || selectedProperty.image };
      await updateAdminProperty(getPropertyId(updated), { images: updatedImages, image: updated.image });
      await refreshProperties();
      setSelectedProperty(updated);
      notify({ message: 'Image uploaded.', variant: 'success' });
    } catch (e) {
      console.error('Upload failed', e);
      notify({ message: e.message || 'Image upload failed.', variant: 'error' });
    }
  };

  const handleDeleteImageForSelected = async (index) => {
    if (!selectedProperty) return;
    try {
      notify({ message: 'Deleting image...', variant: 'info' });
      await deletePropertyImage(getPropertyId(selectedProperty), index);
      const nextImages = (selectedProperty.images || []).filter((_, i) => i !== index);
      const updated = { ...selectedProperty, images: nextImages, image: nextImages[0] || '' };
      await updateAdminProperty(getPropertyId(updated), { images: updated.images, image: updated.image });
      await refreshProperties();
      setSelectedProperty(updated);
      notify({ message: 'Image deleted.', variant: 'success' });
    } catch (e) {
      console.error('Delete image failed', e);
      notify({ message: e.message || 'Unable to delete image.', variant: 'error' });
    }
  };

  const moveImage = async (fromIndex, toIndex) => {
    if (!selectedProperty) return;
    const images = Array.isArray(selectedProperty.images) ? [...selectedProperty.images] : (selectedProperty.image ? [selectedProperty.image] : []);
    if (fromIndex < 0 || fromIndex >= images.length || toIndex < 0 || toIndex >= images.length) return;
    const item = images.splice(fromIndex, 1)[0];
    images.splice(toIndex, 0, item);
    const updated = { ...selectedProperty, images, image: images[0] || '' };
    try {
      await updateAdminProperty(getPropertyId(updated), { images: updated.images, image: updated.image });
      await refreshProperties();
      setSelectedProperty(updated);
      notify({ message: 'Image order updated.', variant: 'success' });
    } catch (e) {
      console.error('Reorder failed', e);
      notify({ message: e.message || 'Unable to reorder images.', variant: 'error' });
    }
  };

  const paymentHistory = (appData.payments || []).filter((payment) => (payment.propertyName || payment.property) === (selectedProperty?.title || ''));
  const duesForProperty = (appData.dues || []).filter((due) => (due.propertyName || due.property) === (selectedProperty?.title || ''));

  return (
    <div className="page-section properties-page">
      <div className="summary-strip inventory-strip">
        <div className="summary-item primary">
          <span>Total inventory</span>
          <strong>{inventoryStats.total}</strong>
        </div>
        <div className="summary-item success">
          <span>Available now</span>
          <strong>{inventoryStats.available}</strong>
        </div>
        <div className="summary-item danger">
          <span>For rent</span>
          <strong>{inventoryStats.forRent}</strong>
        </div>
        <div className="summary-item info">
          <span>Portfolio value</span>
          <strong>{formatCurrency(inventoryStats.value)}</strong>
        </div>
      </div>

      <section className="panel-card toolbar-card">
        <div className="toolbar-row">
          <div className="toolbar-search">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title, location, owner..." />
          </div>
          <div className="toolbar-group">
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="All">All Types</option>
              {['House', 'Apartment', 'Flat', 'Room', 'Hostel'].map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="All">All Status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select value={sortKey} onChange={(event) => setSortKey(event.target.value)}>
              <option value="createdAt">Newest</option>
              <option value="price">Price</option>
              <option value="title">Title</option>
            </select>
            <button type="button" className="primary-button" onClick={openCreateModal}>Add Property</button>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="card-header">
          <h3>Property Inventory</h3>
          <span className="mini-badge">{filteredProperties.length} properties</span>
        </div>

        {filteredProperties.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <h4>No properties found</h4>
            <p>Adjust the filters or add a new property.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Property</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Price</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.map((property) => (
                  <tr key={getPropertyId(property) || property.id}>
                    <td>
                      <img src={property.image || 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=300&q=80'} alt={property.title} className="property-thumb" />
                    </td>
                    <td>
                      <strong>{property.title}</strong>
                      <small>{property.city}</small>
                    </td>
                    <td>{property.propertyType}</td>
                    <td>{property.location}</td>
                    <td>{formatCurrency(property.price || property.salePrice || 0)}</td>
                    <td>{property.ownerName}</td>
                    <td>
                      <select value={property.status} onChange={(event) => changeStatus(getPropertyId(property), event.target.value)} className="status-select">
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td>{formatDate(property.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="table-button light" onClick={() => openEditModal(property)}>Edit</button>
                        <button type="button" className="table-button light" onClick={() => { setSelectedProperty(property); setManageModalOpen(true); }}>Manage</button>
                        <button type="button" className="table-button light" onClick={() => duplicateProperty(property)}>Copy & Edit</button>
                        <button type="button" className="table-button danger" onClick={() => setDeletingId(getPropertyId(property))}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={modalOpen}
        title={editingId ? 'Edit Property' : 'Add Property'}
        onClose={() => { setModalOpen(false); setErrors({}); }}
        footer={
          <>
            <button type="button" className="outline-button" onClick={() => { setModalOpen(false); setErrors({}); }}>Cancel</button>
            <button type="submit" className="primary-button" form="property-form">Save Property</button>
          </>
        }
      >
        <form id="property-form" className="property-form" onSubmit={handleSubmit}>
          <div className="form-grid two-col">
            <label>
              Property title
              <input name="title" value={formData.title} onChange={handleFieldChange} />
              {errors.title && <span className="field-error">{errors.title}</span>}
            </label>
            <label>
              Property type
              <select name="propertyType" value={formData.propertyType} onChange={handleFieldChange}>
                {['House', 'Apartment', 'Flat', 'Room', 'Hostel'].map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-grid two-col">
            <label>
              Category
              <select name="category" value={formData.category} onChange={handleFieldChange}>
                {['House', 'Apartment', 'Flat', 'Room', 'Hostel'].map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select name="status" value={formData.status} onChange={handleFieldChange}>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Description
            <textarea name="description" rows="4" value={formData.description} onChange={handleFieldChange} />
          </label>

          <div className="section-title">Pricing</div>
          <div className="form-grid three-col">
            <label>
              Sale price
              <input type="number" name="price" value={formData.price} onChange={handleFieldChange} />
              {errors.price && <span className="field-error">{errors.price}</span>}
            </label>
            <label>
              Rent price
              <input type="number" name="rent" value={formData.rent} onChange={handleFieldChange} />
            </label>
            <label>
              Deposit
              <input type="number" name="deposit" value={formData.deposit} onChange={handleFieldChange} />
            </label>
          </div>

          <div className="form-grid three-col">
            <label>
              Sale price 2
              <input type="number" name="salePrice" value={formData.salePrice} onChange={handleFieldChange} />
            </label>
            <label>
              Other charges
              <input type="number" name="otherCharges" value={formData.otherCharges} onChange={handleFieldChange} />
            </label>
            <label>
              Area
              <input type="number" name="area" value={formData.area} onChange={handleFieldChange} />
              {errors.area && <span className="field-error">{errors.area}</span>}
            </label>
          </div>

          <div className="section-title">Property details</div>
          <div className="form-grid three-col">
            <label>
              Bedrooms
              <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleFieldChange} />
            </label>
            <label>
              Bathrooms
              <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleFieldChange} />
            </label>
            <label>
              Furnishing
              <select name="furnished" value={formData.furnished} onChange={handleFieldChange}>
                <option value="Fully Furnished">Fully Furnished</option>
                <option value="Semi Furnished">Semi Furnished</option>
                <option value="Unfurnished">Unfurnished</option>
              </select>
            </label>
          </div>

          <div className="form-grid two-col">
            <label>
              Floor
              <input type="number" name="floor" value={formData.floor} onChange={handleFieldChange} />
            </label>
            <label>
              Total floors
              <input type="number" name="totalFloors" value={formData.totalFloors} onChange={handleFieldChange} />
            </label>
          </div>

          <div className="section-title">Location</div>
          <div className="form-grid two-col">
            <label>
              City
              <input name="city" value={formData.city} onChange={handleFieldChange} />
              {errors.city && <span className="field-error">{errors.city}</span>}
            </label>
            <label>
              Area
              <input name="location" value={formData.location} onChange={handleFieldChange} />
              {errors.location && <span className="field-error">{errors.location}</span>}
            </label>
          </div>
          <label>
            Address
            <textarea name="address" rows="3" value={formData.address} onChange={handleFieldChange} />
          </label>

          <div className="section-title">Owner information</div>
          <div className="form-grid two-col">
            <label>
              Owner name
              <input name="ownerName" value={formData.ownerName} onChange={handleFieldChange} />
              {errors.ownerName && <span className="field-error">{errors.ownerName}</span>}
            </label>
            <label>
              Owner phone
              <input name="ownerPhone" value={formData.ownerPhone} onChange={handleFieldChange} />
              {errors.ownerPhone && <span className="field-error">{errors.ownerPhone}</span>}
            </label>
          </div>
          <label>
            Owner email
            <input name="ownerEmail" type="email" value={formData.ownerEmail} onChange={handleFieldChange} />
            {errors.ownerEmail && <span className="field-error">{errors.ownerEmail}</span>}
          </label>

          <div className="section-title">Images</div>
          <label>
            Main image
            <input type="file" accept="image/*" onChange={handleImagePick} />
          </label>
          {formData.image && <img src={formData.image} alt="Preview" className="image-preview" />}
        </form>
      </Modal>

      <Modal
        open={manageModalOpen && Boolean(selectedProperty)}
        title={`Manage ${selectedProperty?.title || 'Property'}`}
        onClose={() => setManageModalOpen(false)}
        footer={<button type="button" className="outline-button" onClick={() => setManageModalOpen(false)}>Close</button>}
      >
        {selectedProperty && (
          <div className="manage-property-panel">
            <div className="detail-header">
              <img src={selectedProperty.image} alt={selectedProperty.title} className="property-thumb large" />
              <div>
                <h4>{selectedProperty.title}</h4>
                <p>{selectedProperty.propertyType} • {selectedProperty.location}</p>
              </div>
            </div>
            <div className="detail-grid">
              <div><strong>Property ID:</strong> <span>{selectedProperty.id}</span></div>
              <div><strong>Status:</strong> <span>{selectedProperty.status}</span></div>
              <div><strong>Price:</strong> <span>{formatCurrency(selectedProperty.price || 0)}</span></div>
              <div><strong>Rent:</strong> <span>{formatCurrency(selectedProperty.rent || 0)}</span></div>
              <div><strong>Deposit:</strong> <span>{formatCurrency(selectedProperty.deposit || 0)}</span></div>
              <div><strong>Owner:</strong> <span>{selectedProperty.ownerName}</span></div>
            </div>

            <div className="subsection-block">
              <h5>Price History</h5>
              {(selectedProperty.priceHistory || []).length ? (
                <ul>
                  {(selectedProperty.priceHistory || []).slice(0, 5).map((item) => (
                    <li key={item.historyId}>{formatDate(item.changedAt)} • {formatCurrency(item.oldPrice)} → {formatCurrency(item.newPrice)}</li>
                  ))}
                </ul>
              ) : <p>No price changes recorded yet.</p>}
            </div>

            <div className="subsection-block">
              <h5>Property Payment History</h5>
              {paymentHistory.length ? (
                <ul>
                  {paymentHistory.slice(0, 5).map((payment) => (
                    <li key={payment.id || payment.paymentId}>{formatDate(payment.paymentDate || payment.date)} • {payment.userName || payment.user} • {formatCurrency(payment.amount)} • {payment.status}</li>
                  ))}
                </ul>
              ) : <p>No payment history for this property.</p>}
            </div>

            <div className="subsection-block">
              <h5>Due History</h5>
              {duesForProperty.length ? (
                <ul>
                  {duesForProperty.slice(0, 5).map((due) => (
                    <li key={due.id}>{formatDate(due.dueDate)} • {due.residentName || due.user} • {formatCurrency(due.remainingAmount || due.currentCharge || 0)} • {due.status || due.paymentStatus}</li>
                  ))}
                </ul>
              ) : <p>No due history reported.</p>}
            </div>

            <div className="subsection-block">
              <h5>Images</h5>
              <p>Upload, preview, delete or reorder property images.</p>
              <label className="file-label">
                Add image
                <input type="file" accept="image/*" onChange={handleUploadImageForSelected} />
              </label>
              <div className="images-list">
                {(selectedProperty.images || (selectedProperty.image ? [selectedProperty.image] : [])).map((img, idx) => (
                  <div className="image-item" key={`${String(selectedProperty.id||selectedProperty._id)}-${idx}`}>
                    <img src={img} alt={`img-${idx}`} />
                    <div className="image-controls">
                      <button type="button" className="small" onClick={() => moveImage(idx, Math.max(0, idx - 1))} disabled={idx === 0}>←</button>
                      <button type="button" className="small" onClick={() => moveImage(idx, idx + 1)} disabled={idx === ((selectedProperty.images || []).length - 1)}>→</button>
                      <button type="button" className="small danger" onClick={() => handleDeleteImageForSelected(idx)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(deletingId)}
        title="Are you sure?"
        onClose={() => setDeletingId(null)}
        footer={
          <>
            <button type="button" className="outline-button" onClick={() => setDeletingId(null)}>Cancel</button>
            <button type="button" className="primary-button danger-button" onClick={() => { const id = deletingId; handleDelete(id); }}>Delete</button>
          </>
        }
      >
        <p>This action cannot be undone.</p>
      </Modal>
    </div>
  );
}

export default PropertiesPage;
