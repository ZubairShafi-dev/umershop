import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Phone, 
  MapPin, 
  MoreVertical,
  X,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'suppliers'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSuppliers(data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (supplier = null) => {
    if (supplier) {
      setCurrentSupplier(supplier);
      setFormData({
        name: supplier.name,
        phone: supplier.phone,
        address: supplier.address,
        notes: supplier.notes || ''
      });
    } else {
      setCurrentSupplier(null);
      setFormData({ name: '', phone: '', address: '', notes: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (currentSupplier) {
        await updateDoc(doc(db, 'suppliers', currentSupplier.id), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        toast.success("Supplier updated successfully");
      } else {
        await addDoc(collection(db, 'suppliers'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
        toast.success("Supplier added successfully");
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (error) {
      console.error("Error saving supplier:", error);
      toast.error("Failed to save supplier");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        await deleteDoc(doc(db, 'suppliers', id));
        toast.success("Supplier deleted");
        fetchSuppliers();
      } catch (error) {
        toast.error("Failed to delete supplier");
      }
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-400" />
            Supplier Management
          </h1>
          <p className="text-slate-400 text-sm">Manage your device providers and contact information.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2 justify-center"
        >
          <Plus className="w-4 h-4" />
          Add New Supplier
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-900/30">
          <div className="relative max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="Search by name or phone..."
              className="input-field pl-10 py-2 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Supplier Name</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Address</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" />
                    <p className="text-slate-500 text-sm mt-2">Loading suppliers...</p>
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="bg-slate-900/50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-slate-700" />
                    </div>
                    <p className="text-slate-400 font-medium">No suppliers found</p>
                    <p className="text-slate-600 text-sm">Add your first supplier to get started.</p>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white">{supplier.name}</div>
                      {supplier.notes && (
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{supplier.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {supplier.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {supplier.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenModal(supplier)}
                          className="p-2 text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(supplier.id)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-lg animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white">
                {currentSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Enter supplier shop name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    className="input-field"
                    placeholder="+92 300 1234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Address</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Shop city/area"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Notes (Optional)</label>
                  <textarea
                    className="input-field min-h-[100px] resize-none"
                    placeholder="Payment terms, special models, etc."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary flex-1 py-2.5"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : currentSupplier ? 'Update' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
