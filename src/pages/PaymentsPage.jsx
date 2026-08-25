import { useMemo, useState } from "react";
import "./PaymentsPage.css";
import Modal from "../components/Modal";
import { generateId } from "../services/localStorage";
import { formatCurrency, formatDate } from "../utils/formatters";

const emptyForm = {
  user: "",
  property: "",
  amount: "",
  status: "Paid",
  method: "Bank Transfer",
  note: "",
};

function PaymentsPage({ appData, setAppData, notify }) {
  const payments = appData.payments || [];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const filteredPayments = useMemo(() => {
    const next = [...payments].filter((payment) => {
      const matchesSearch =
        !search ||
        [payment.user, payment.property, payment.id]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || payment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    return next.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [payments, search, statusFilter]);

  const totalCollected = payments
    .filter((payment) => payment.status === "Paid")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const validate = () => {
    const nextErrors = {};
    if (!formData.user.trim()) nextErrors.user = "Payer is required";
    if (!formData.property.trim()) nextErrors.property = "Property is required";
    if (!formData.amount || Number(formData.amount) <= 0)
      nextErrors.amount = "Valid amount is required";
    return nextErrors;
  };

  const handleSave = (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      id: generateId("py"),
      user: formData.user.trim(),
      property: formData.property.trim(),
      amount: Number(formData.amount),
      status: formData.status,
      method: formData.method,
      note: formData.note.trim(),
      date: new Date().toISOString(),
    };

    setAppData((prev) => ({
      ...prev,
      payments: [payload, ...(prev.payments || [])],
      dues: (prev.dues || []).map((due) =>
        due.user === payload.user &&
        due.property === payload.property &&
        payload.status === "Paid"
          ? {
              ...due,
              status: "Paid",
              paymentStatus: "Paid",
              updatedAt: new Date().toISOString(),
            }
          : due,
      ),
    }));
    notify({ message: "Payment recorded successfully.", variant: "success" });
    setModalOpen(false);
    setFormData(emptyForm);
    setErrors({});
  };

  return (
    <div className="page-section payments-page">
      <section className="panel-card toolbar-card">
        <div className="toolbar-row">
          <div className="toolbar-search">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by user or property"
            />
          </div>
          <div className="toolbar-group">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
            <button
              type="button"
              className="primary-button"
              onClick={() => setModalOpen(true)}
            >
              Record Payment
            </button>
          </div>
        </div>
      </section>

      <div className="stats-grid three-column">
        <div className="stat-card primary">
          <p>Collected</p>
          <h3>{formatCurrency(totalCollected)}</h3>
        </div>
        <div className="stat-card success">
          <p>Paid</p>
          <h3>{payments.filter((item) => item.status === "Paid").length}</h3>
        </div>
        <div className="stat-card warning">
          <p>Pending</p>
          <h3>{payments.filter((item) => item.status === "Pending").length}</h3>
        </div>
      </div>

      <section className="panel-card">
        <div className="card-header">
          <h3>Payment Ledger</h3>
          <span className="mini-badge">{filteredPayments.length} records</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>User</th>
                <th>Property</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.id}</td>
                  <td>{payment.user}</td>
                  <td>{payment.property}</td>
                  <td>{formatCurrency(payment.amount)}</td>
                  <td>{payment.method || "Bank Transfer"}</td>
                  <td>{formatDate(payment.date)}</td>
                  <td>
                    <span
                      className={`status-badge ${String(payment.status).toLowerCase()}`}
                    >
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={modalOpen}
        title="Record Payment"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="outline-button"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              form="payment-form"
            >
              Save
            </button>
          </>
        }
      >
        <form id="payment-form" className="property-form" onSubmit={handleSave}>
          <div className="form-grid two-col">
            <label>
              User
              <input
                value={formData.user}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, user: event.target.value }))
                }
              />
              {errors.user && (
                <span className="field-error">{errors.user}</span>
              )}
            </label>
            <label>
              Property
              <input
                value={formData.property}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    property: event.target.value,
                  }))
                }
              />
              {errors.property && (
                <span className="field-error">{errors.property}</span>
              )}
            </label>
          </div>
          <div className="form-grid two-col">
            <label>
              Amount
              <input
                type="number"
                value={formData.amount}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    amount: event.target.value,
                  }))
                }
              />
              {errors.amount && (
                <span className="field-error">{errors.amount}</span>
              )}
            </label>
            <label>
              Method
              <select
                value={formData.method}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    method: event.target.value,
                  }))
                }
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Wallet">Wallet</option>
              </select>
            </label>
          </div>
          <div className="form-grid two-col">
            <label>
              Status
              <select
                value={formData.status}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: event.target.value,
                  }))
                }
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </label>
          </div>
          <label>
            Note
            <textarea
              rows="3"
              value={formData.note}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, note: event.target.value }))
              }
            />
          </label>
        </form>
      </Modal>
    </div>
  );
}

export default PaymentsPage;
