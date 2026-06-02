import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { generateSalePdf } from '../utils/pdfGenerator';
import { X } from 'lucide-react';

export default function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'sales'), orderBy('soldAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSales(data);
    });
    return () => unsubscribe();
  }, []);

  const openModal = (sale) => {
    setSelectedSale(sale);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSale(null);
  };

  const handleDownloadPdf = () => {
    if (selectedSale) {
      generateSalePdf(selectedSale);
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100">
      <h1 className="text-2xl font-bold mb-4">Sales History</h1>
      <div className="overflow-x-auto rounded-lg shadow-lg bg-slate-800">
        <table className="w-full border-collapse">
          <thead className="bg-slate-700">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Items</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-left">Profit</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr
                key={sale.id}
                className="border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer transition-colors"
                onClick={() => openModal(sale)}
              >
                <td className="p-3">
                  {sale.soldAt?.seconds
                    ? new Date(sale.soldAt.seconds * 1000).toLocaleDateString()
                    : '—'}
                </td>
                <td className="p-3">{sale.customerName || '—'}</td>
                <td className="p-3">{sale.items?.length || 0}</td>
                <td className="p-3">Rs. {sale.totalPrice?.toLocaleString() ?? '—'}</td>
                <td className="p-3">Rs. {sale.totalProfit?.toLocaleString() ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {isModalOpen && selectedSale && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
          <div className="bg-slate-800 rounded-lg w-11/12 md:max-w-2xl p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 p-1 hover:bg-slate-700 rounded"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
            <h2 className="text-xl font-semibold mb-4">Sale Details</h2>
            <p className="mb-2"><strong>Date:</strong> {saleDate(selectedSale)}</p>
            <p className="mb-2"><strong>Customer:</strong> {selectedSale.customerName || 'N/A'}</p>
            <div className="overflow-x-auto mt-4">
              <table className="w-full border-collapse">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2 text-left">Qty</th>
                    <th className="p-2 text-left">Unit Price</th>
                    <th className="p-2 text-left">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.items?.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-700">
                      <td className="p-2">{item.name}</td>
                      <td className="p-2">{item.qty}</td>
                      <td className="p-2">Rs. {item.salePrice?.toLocaleString()}</td>
                      <td className="p-2">Rs. {(item.salePrice * item.qty).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4"><strong>Total:</strong> Rs. {selectedSale.totalPrice?.toLocaleString()}</p>
            <p className="mb-4"><strong>Profit:</strong> Rs. {selectedSale.totalProfit?.toLocaleString()}</p>
            <button
              onClick={handleDownloadPdf}
              className="mt-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded"
            >
              Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function saleDate(sale) {
  if (sale.soldAt?.seconds) {
    return new Date(sale.soldAt.seconds * 1000).toLocaleString();
  }
  return '—';
}
