import { useMemo, useState } from 'react';
import './ApartmentsPage.css';
import Modal from '../components/Modal';
import { formatCurrency, formatDate } from '../utils/formatters';
import { generateId } from '../services/localStorage';

const emptyForm = {
  title: '',
  propertyType: 'Apartment',
  category: 'Apartment',
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

function ApartmentsPage({ appData, setAppData, notify }) {
  const properties = (appData.properties || []).filter((item) => item.propertyType === 'Apartment' || item.category === 'Apartment');
  const [search, setSearch] = useState('');
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
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    next.sort((a, b) => {
      if (sortKey === 'price') return Number(b.price || 0) - Number(a.price || 0);
      if (sortKey === 'title') return String(a.title).localeCompare(String(b.title));
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return next;
  }, [properties, search, statusFilter, sortKey]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (property) => {
    setEditingId(property.id);
    setFormData({
      title: property.title || '',
      propertyType: property.propertyType || 'Apartment',
      category: property.category || property.propertyType || 'Apartment',
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

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const previousProperty = editingId ? properties.find((item) => item.id === editingId) : null;
    const nextPriceHistory = previousProperty?.priceHistory || [];

    if (editingId && previousProperty) {
      const prevPrice = Number(previousProperty.price || 0);
      const nextPrice = Number(formData.price || 0);
      if (prevPrice !== nextPrice) {
        nextPriceHistory.unshift({
          historyId: `hist-${Date.now()}`,
          propertyId: previousProperty.id,
          oldPrice: prevPrice,
          newPrice: nextPrice,
          changedBy: 'Admin',
          changedAt: new Date().toISOString(),
        });
      }
    }

    const payload = {
      id: editingId || generateId('prop'),
      title: formData.title.trim(),
      propertyType: 'Apartment',
      category: 'Apartment',
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
      image: formData.image || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80',
      images: formData.images || [formData.image || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80'],
      status: formData.status,
      createdAt: editingId ? previousProperty?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      priceHistory: nextPriceHistory,
    };

    setAppData((prev) => {
      const list = editingId ? prev.properties.map((item) => (item.id === editingId ? payload : item)) : [payload, ...(prev.properties || [])];
      return { ...prev, properties: list };
    });

    setAppData((prev) => ({
      ...prev,
      notifications: [
        {
          id: `notif-${Date.now()}`,
          title: editingId ? 'Apartment updated' : 'New apartment added',
          message: `${payload.title} was ${editingId ? 'updated' : 'added'} successfully.`,
          propertyId: payload.id,
          propertyType: 'Apartment',
          time: 'Just now',
          date: new Date().toISOString(),
          read: false,
          priority: 'Normal',
        },
        ...(prev.notifications || []),
      ],
    }));

    addActivity(editingId ? 'Apartment edited' : 'Apartment added', `${payload.title} was ${editingId ? 'updated' : 'added'} to the apartment catalog.`);
    notify({ message: editingId ? 'Apartment updated successfully.' : 'Apartment added successfully.', variant: 'success' });
    setModalOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleDelete = (propertyId) => {
    setAppData((prev) => ({ ...prev, properties: (prev.properties || []).filter((item) => item.id !== propertyId) }));
    addActivity('Apartment deleted', 'An apartment was removed from the catalog.');
    notify({ message: 'Apartment deleted successfully.', variant: 'success' });
    setDeletingId(null);
  };

  const changeStatus = (propertyId, nextStatus) => {
    setAppData((prev) => ({
      ...prev,
      properties: (prev.properties || []).map((item) => (item.id === propertyId ? { ...item, status: nextStatus, updatedAt: new Date().toISOString() } : item)),
    }));
    addActivity('Apartment status changed', `An apartment status was updated to ${nextStatus}.`);
    notify({ message: `Apartment status updated to ${nextStatus}.`, variant: 'success' });
  };

  const duplicateProperty = (property) => {
    const duplicate = {
      ...property,
      id: generateId('prop'),
      title: `${property.title} Copy`,
      propertyType: 'Apartment',
      category: 'Apartment',
      status: property.status || 'Available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      priceHistory: property.priceHistory || [],
    };

    setAppData((prev) => ({ ...prev, properties: [duplicate, ...(prev.properties || [])] }));
    setEditingId(duplicate.id);
    setFormData({
      title: duplicate.title || '',
      propertyType: 'Apartment',
      category: 'Apartment',
      description: duplicate.description || '',
      price: duplicate.price || '',
      rent: duplicate.rent || '',
      salePrice: duplicate.salePrice || '',
      deposit: duplicate.deposit || '',
      otherCharges: duplicate.otherCharges || '',
      location: duplicate.location || '',
      city: duplicate.city || '',
      address: duplicate.address || '',
      bedrooms: duplicate.bedrooms || '',
      bathrooms: duplicate.bathrooms || '',
      area: duplicate.area || '',
      furnished: duplicate.furnished || 'Fully Furnished',
      floor: duplicate.floor || '',
      totalFloors: duplicate.totalFloors || '',
      ownerName: duplicate.ownerName || '',
      ownerPhone: duplicate.ownerPhone || '',
      ownerEmail: duplicate.ownerEmail || '',
      image: duplicate.image || '',
      status: duplicate.status || 'Available',
    });
    setErrors({});
    setModalOpen(true);
    addActivity('Apartment duplicated', `${property.title} was duplicated and opened for editing.`);
    notify({ message: 'Apartment duplicated and opened for editing.', variant: 'success' });
  };

  const paymentHistory = (appData.payments || []).filter((payment) => (payment.propertyName || payment.property) === (selectedProperty?.title || ''));
  const duesForProperty = (appData.dues || []).filter((due) => (due.propertyName || due.property) === (selectedProperty?.title || ''));

  return (
    <div className="page-section apartments-page">
      <section className="panel-card toolbar-card">
        <div className="toolbar-row">
          <div className="toolbar-search">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search apartment, area, owner..." />
          </div>
          <div className="toolbar-group">
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
            <button type="button" className="primary-button" onClick={openCreateModal}>Add Apartment</button>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="card-header">
          <h3>Apartment Inventory</h3>
          <span className="mini-badge">{filteredProperties.length} apartments</span>
        </div>

        {filteredProperties.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <h4>No apartments found</h4>
            <p>Adjust the filters or add a new apartment listing.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Apartment</th>
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
                  <tr key={property.id}>
                    <td>
                      <img src={property.image || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=300&q=80'} alt={property.title} className="property-thumb" />
                    </td>
                    <td>
                      <strong>{property.title}</strong>
                      <small>{property.city}</small>
                    </td>
                    <td>{property.location}</td>
                    <td>{formatCurrency(property.price || property.salePrice || 0)}</td>
                    <td>{property.ownerName}</td>
                    <td>
                      <select value={property.status} onChange={(event) => changeStatus(property.id, event.target.value)} className="status-select">
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
                        <button type="button" className="table-button danger" onClick={() => setDeletingId(property.id)}>Delete</button>
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
        title={editingId ? 'Edit Apartment' : 'Add Apartment'}
        onClose={() => { setModalOpen(false); setErrors({}); }}
        footer={
          <>
            <button type="button" className="outline-button" onClick={() => { setModalOpen(false); setErrors({}); }}>Cancel</button>
            <button type="submit" className="primary-button" form="apartment-form">Save Apartment</button>
          </>
        }
      >
        <form id="apartment-form" className="property-form" onSubmit={handleSubmit}>
          <div className="form-grid two-col">
            <label>
              Apartment title
              <input name="title" value={formData.title} onChange={handleFieldChange} />
              {errors.title && <span className="field-error">{errors.title}</span>}
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

          <div className="section-title">Apartment details</div>
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
        title={`Manage ${selectedProperty?.title || 'Apartment'}`}
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
              <div><strong>Apartment ID:</strong> <span>{selectedProperty.id}</span></div>
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
              <h5>Payment History</h5>
              {paymentHistory.length ? (
                <ul>
                  {paymentHistory.slice(0, 5).map((payment) => (
                    <li key={payment.id || payment.paymentId}>{formatDate(payment.paymentDate || payment.date)} • {payment.userName || payment.user} • {formatCurrency(payment.amount)} • {payment.status}</li>
                  ))}
                </ul>
              ) : <p>No payment history for this apartment.</p>}
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

export default ApartmentsPage;
