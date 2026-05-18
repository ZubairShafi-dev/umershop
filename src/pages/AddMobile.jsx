import React, { useState, useEffect, useRef, Fragment } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, onSnapshot, doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { 
  PlusCircle, 
  Smartphone, 
  Scan, 
  Save, 
  Loader2,
  DollarSign,
  Plus,
  X,
  UserPlus,
  ChevronDown,
  Check,
  Building2,
  PenLine
} from 'lucide-react';
import { Dialog, Transition, Combobox } from '@headlessui/react';
import toast from 'react-hot-toast';

const MOBILE_DATA = {
  'Samsung': ['Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S23 FE', 'Galaxy A54', 'Galaxy A34', 'Galaxy M54', 'Galaxy Z Fold 5', 'Galaxy Z Flip 5'],
  'Apple': ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15', 'iPhone 14', 'iPhone 13', 'iPhone SE (2022)'],
  'Vivo': ['V29 Pro', 'V29', 'V29e', 'Y100', 'Y17s', 'Y27', 'X100 Pro', 'X100'],
  'Oppo': ['Reno 10 Pro+', 'Reno 10', 'F23', 'A78', 'A58', 'Find N3 Flip'],
  'Xiaomi': ['Redmi Note 13 Pro+', 'Redmi Note 13', 'Redmi 12', 'Xiaomi 13T Pro', 'Xiaomi 13 Ultra', 'Poco F5'],
  'Realme': ['Realme 11 Pro+', 'Realme 11', 'Realme C55', 'Realme C53', 'GT Neo 5'],
  'Infinix': ['Note 30 Pro', 'Note 30', 'Hot 30', 'Zero 30 5G', 'Smart 7'],
  'Tecno': ['Camon 20 Premier', 'Camon 20', 'Spark 10 Pro', 'Phantom V Fold'],
  'Google': ['Pixel 8 Pro', 'Pixel 8', 'Pixel 7a', 'Pixel 7 Pro', 'Pixel Fold'],
  'OnePlus': ['OnePlus 12', 'OnePlus 11', 'OnePlus Nord CE 3', 'OnePlus Nord 3'],
  'Nokia': ['Nokia G42', 'Nokia C32', 'Nokia G21'],
  'Motorola': ['Moto G84', 'Moto G54', 'Moto Edge 40'],
};

export default function AddMobile() {
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  
  const [brandQuery, setBrandQuery] = useState('');
  const [modelQuery, setModelQuery] = useState('');
  const [supplierQuery, setSupplierQuery] = useState('');
  const [customBrands, setCustomBrands] = useState({});
  
  const imei1InputRef = useRef(null);
  const imei2InputRef = useRef(null);
  
  const initialFormState = {
    imei1: '',
    imei2: '',
    brand: '',
    model: '',
    ramStorage: '',
    color: '',
    purchasePrice: '',
    sellingPrice: '',
    supplierId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    warranty: '1 Year Local',
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', address: '' });
  const [addingSupplier, setAddingSupplier] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'suppliers'), orderBy('name', 'asc'));
    const unsubscribeSuppliers = onSnapshot(q, (snapshot) => {
      setSuppliers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingSuppliers(false);
    });

    const unsubscribeBrands = onSnapshot(collection(db, 'mobile_brands'), (snapshot) => {
      const data = {};
      snapshot.forEach(doc => {
        data[doc.id] = doc.data().models || [];
      });
      setCustomBrands(data);
    });

    if (imei1InputRef.current) imei1InputRef.current.focus();
    return () => {
      unsubscribeSuppliers();
      unsubscribeBrands();
    };
  }, []);

  const saveCustomBrandModel = async (brand, model) => {
    if (!brand || !model) return;
    try {
      const brandRef = doc(db, 'mobile_brands', brand);
      const brandSnap = await getDoc(brandRef);
      if (brandSnap.exists()) {
        await updateDoc(brandRef, {
          models: arrayUnion(model)
        });
      } else {
        await setDoc(brandRef, {
          models: [model]
        });
      }
    } catch (error) {
      console.error("Error saving custom brand/model:", error);
    }
  };

  const customBrandKeys = Object.keys(customBrands).filter(b => b);
  const builtInBrandKeys = Object.keys(MOBILE_DATA).filter(b => !customBrands[b]);
  const brandList = [...customBrandKeys, ...builtInBrandKeys];

  // Filter brands — show typed value as first custom option if it doesn't match
  const filteredBrands = brandQuery === ''
    ? brandList
    : [
        ...brandList.filter(brand =>
          brand.toLowerCase().includes(brandQuery.toLowerCase())
        ),
        // Add the typed value as a custom option if not already in list
        ...(brandList.some(b => b.toLowerCase() === brandQuery.toLowerCase())
          ? []
          : [brandQuery])
      ];

  const currentModels = formData.brand
    ? [
        ...(customBrands[formData.brand] || []),
        ...(MOBILE_DATA[formData.brand] || [])
      ].filter((v, i, a) => a.indexOf(v) === i)
    : [
        ...Object.values(customBrands).flat(),
        ...Object.values(MOBILE_DATA).flat()
      ].filter((v, i, a) => a.indexOf(v) === i);

  // Filter models — show typed value as first custom option if it doesn't match
  const filteredModels = modelQuery === ''
    ? currentModels
    : [
        ...currentModels.filter(model =>
          model.toLowerCase().includes(modelQuery.toLowerCase())
        ),
        // Add the typed value as a custom option if not already in list
        ...(currentModels.some(m => m.toLowerCase() === modelQuery.toLowerCase())
          ? []
          : [modelQuery])
      ];

  const filteredSuppliers = supplierQuery === ''
    ? suppliers
    : suppliers.filter(s => s.name.toLowerCase().includes(supplierQuery.toLowerCase()));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQuickAddSupplier = async (e) => {
    e.preventDefault();
    if (!newSupplier.name) return;
    try {
      setAddingSupplier(true);
      const docRef = await addDoc(collection(db, 'suppliers'), { ...newSupplier, createdAt: new Date().toISOString() });
      setFormData(prev => ({ ...prev, supplierId: docRef.id }));
      setIsSupplierModalOpen(false);
      setNewSupplier({ name: '', phone: '', address: '' });
      toast.success("Supplier added!");
    } catch (error) {
      toast.error("Failed to add supplier");
    } finally {
      setAddingSupplier(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.imei1 || !formData.brand || !formData.model || !formData.purchasePrice || !formData.supplierId) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      setSubmitting(true);
      await addDoc(collection(db, 'mobiles'), {
        ...formData,
        purchasePrice: parseFloat(formData.purchasePrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        status: 'Available',
        createdAt: new Date().toISOString()
      });

      // Check if brand or model is custom (not in built-in MOBILE_DATA)
      const isBuiltInBrand = Object.keys(MOBILE_DATA).includes(formData.brand);
      const isBuiltInModel = isBuiltInBrand && MOBILE_DATA[formData.brand].includes(formData.model);

      if (!isBuiltInBrand || !isBuiltInModel) {
        await saveCustomBrandModel(formData.brand, formData.model);
      }

      toast.success("Mobile added!");
      setFormData(initialFormState);
      setBrandQuery('');
      setModelQuery('');
      setSupplierQuery('');
      if (imei1InputRef.current) imei1InputRef.current.focus();
    } catch (error) {
      toast.error("Failed to add mobile");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to check if a value is a custom (user-typed) entry
  const isCustomEntry = (value, list) =>
    value && !list.includes(value);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <PlusCircle className="w-6 h-6 text-primary-400" />
          Add New Stock
        </h1>
        <p className="text-slate-400 text-sm">Real-time inventory entry system. You can type a custom brand or model if not in the list.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* IMEI Section */}
        <div className="card p-6 border-primary-500/20 bg-primary-500/5">
          <div className="flex items-center gap-3 mb-4">
            <Scan className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-bold text-white">IMEI Scanner</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <input
                ref={imei1InputRef}
                type="text"
                name="imei1"
                required
                placeholder="IMEI 1 (Primary)"
                className="input-field pl-12 text-lg font-mono tracking-widest border-primary-500/50 focus:ring-primary-500/50"
                value={formData.imei1}
                onChange={(e) => {
                  handleInputChange(e);
                  if (e.target.value.length >= 15) {
                    imei2InputRef.current?.focus();
                  }
                }}
              />
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-500" />
            </div>
            <div className="relative">
              <input
                ref={imei2InputRef}
                type="text"
                name="imei2"
                placeholder="IMEI 2 (Optional)"
                className="input-field pl-12 text-lg font-mono tracking-widest border-slate-700"
                value={formData.imei2}
                onChange={handleInputChange}
              />
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 space-y-4">
            <h3 className="text-md font-bold text-white flex items-center gap-2 mb-2">
              <Smartphone className="w-5 h-5 text-slate-400" /> Device Details
            </h3>

            <div className="space-y-4">
              {/* Brand Combobox */}
              <Combobox value={formData.brand} onChange={(val) => setFormData({ ...formData, brand: val, model: '' })}>
                <div className="relative">
                  <Combobox.Label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Brand *
                    <span className="ml-2 text-slate-600 normal-case font-normal">(or type your own)</span>
                  </Combobox.Label>
                  <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-slate-800 text-left border border-slate-700">
                    <Combobox.Input
                      className="w-full border-none py-2.5 pl-3 pr-10 text-sm text-white bg-slate-800 focus:ring-0"
                      displayValue={(brand) => brand}
                      onChange={(event) => {
                        setBrandQuery(event.target.value);
                        // Update form data as user types (for custom brand)
                        setFormData(prev => ({ ...prev, brand: event.target.value, model: '' }));
                      }}
                      placeholder="Search or type brand..."
                    />
                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronDown className="h-5 w-5 text-slate-500" />
                    </Combobox.Button>
                  </div>
                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0" afterLeave={() => setBrandQuery('')}>
                    <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-slate-800 py-1 shadow-2xl z-50 border border-slate-700">
                      {filteredBrands.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-500 italic">No brands found.</div>
                      ) : filteredBrands.map((brand) => {
                        const isCustom = isCustomEntry(brand, Object.keys(MOBILE_DATA));
                        return (
                          <Combobox.Option
                            key={brand}
                            className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-primary-600 text-white' : 'text-slate-300'}`}
                            value={brand}
                          >
                            {({ selected, active }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                  {isCustom ? (
                                    <span className="flex items-center gap-2">
                                      <PenLine className="w-3 h-3 text-amber-400" />
                                      <span className="text-amber-300">Use "{brand}"</span>
                                      <span className="text-[10px] text-slate-500 ml-1">(custom)</span>
                                    </span>
                                  ) : brand}
                                </span>
                                {selected && <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-primary-400'}`}><Check className="h-4 w-4" /></span>}
                              </>
                            )}
                          </Combobox.Option>
                        );
                      })}
                    </Combobox.Options>
                  </Transition>
                </div>
              </Combobox>

              {/* Model Combobox */}
              <Combobox value={formData.model} onChange={(val) => setFormData({ ...formData, model: val })}>
                <div className="relative">
                  <Combobox.Label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Model *
                    <span className="ml-2 text-slate-600 normal-case font-normal">(or type your own)</span>
                  </Combobox.Label>
                  <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-slate-800 text-left border border-slate-700">
                    <Combobox.Input
                      className="w-full border-none py-2.5 pl-3 pr-10 text-sm text-white bg-slate-800 focus:ring-0"
                      displayValue={(model) => model}
                      onChange={(event) => {
                        setModelQuery(event.target.value);
                        // Update form data as user types (for custom model)
                        setFormData(prev => ({ ...prev, model: event.target.value }));
                      }}
                      placeholder="Search or type model..."
                    />
                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronDown className="h-5 w-5 text-slate-500" />
                    </Combobox.Button>
                  </div>
                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0" afterLeave={() => setModelQuery('')}>
                    <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-slate-800 py-1 shadow-2xl z-50 border border-slate-700">
                      {filteredModels.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-500 italic">No models found.</div>
                      ) : filteredModels.map((model, idx) => {
                        const isCustom = isCustomEntry(model, currentModels);
                        return (
                          <Combobox.Option
                            key={idx}
                            className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-primary-600 text-white' : 'text-slate-300'}`}
                            value={model}
                          >
                            {({ selected, active }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                  {isCustom ? (
                                    <span className="flex items-center gap-2">
                                      <PenLine className="w-3 h-3 text-amber-400" />
                                      <span className="text-amber-300">Use "{model}"</span>
                                      <span className="text-[10px] text-slate-500 ml-1">(custom)</span>
                                    </span>
                                  ) : model}
                                </span>
                                {selected && <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-primary-400'}`}><Check className="h-4 w-4" /></span>}
                              </>
                            )}
                          </Combobox.Option>
                        );
                      })}
                    </Combobox.Options>
                  </Transition>
                </div>
              </Combobox>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">RAM/Storage</label>
                  <input type="text" name="ramStorage" placeholder="12/256GB" className="input-field" value={formData.ramStorage} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Color</label>
                  <input type="text" name="color" placeholder="Black" className="input-field" value={formData.color} onChange={handleInputChange} />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Supplier */}
          <div className="card p-6 space-y-4">
            <h3 className="text-md font-bold text-white flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-slate-400" /> Pricing & Source
            </h3>
            <div className="space-y-4">
              {/* Supplier Combobox */}
              <Combobox value={formData.supplierId} onChange={(val) => setFormData({ ...formData, supplierId: val })}>
                <div className="relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <Combobox.Label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Supplier *</Combobox.Label>
                    <button type="button" onClick={() => setIsSupplierModalOpen(true)} className="text-primary-400 hover:text-primary-300 text-xs flex items-center gap-1 font-bold">
                      <Plus className="w-3 h-3" /> Quick Add
                    </button>
                  </div>
                  <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-slate-800 text-left border border-slate-700">
                    <Combobox.Input
                      className="w-full border-none py-2.5 pl-3 pr-10 text-sm text-white bg-slate-800 focus:ring-0"
                      displayValue={(id) => suppliers.find(s => s.id === id)?.name || ''}
                      onChange={(event) => setSupplierQuery(event.target.value)}
                      placeholder="Search Supplier..."
                    />
                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronDown className="h-5 w-5 text-slate-500" />
                    </Combobox.Button>
                  </div>
                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0" afterLeave={() => setSupplierQuery('')}>
                    <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-slate-800 py-1 shadow-2xl z-50 border border-slate-700">
                      {filteredSuppliers.map((s) => (
                        <Combobox.Option key={s.id} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-primary-600 text-white' : 'text-slate-300'}`} value={s.id}>
                          {({ selected, active }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{s.name}</span>
                              {selected && <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-primary-400'}`}><Check className="h-4 w-4" /></span>}
                            </>
                          )}
                        </Combobox.Option>
                      ))}
                    </Combobox.Options>
                  </Transition>
                </div>
              </Combobox>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Cost Price *</label>
                  <div className="relative">
                    <input type="number" name="purchasePrice" required placeholder="0" className="input-field pl-8" value={formData.purchasePrice} onChange={handleInputChange} />
                    <span className="absolute left-3 top-2.5 text-slate-500 text-sm font-bold">Rs.</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Selling Price *</label>
                  <div className="relative">
                    <input type="number" name="sellingPrice" required placeholder="0" className="input-field pl-8" value={formData.sellingPrice} onChange={handleInputChange} />
                    <span className="absolute left-3 top-2.5 text-slate-500 text-sm font-bold">Rs.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-lg font-bold">
          {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5" /> Add to Inventory</>}
        </button>
      </form>

      {/* Supplier Modal */}
      <Transition show={isSupplierModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsSupplierModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 shadow-2xl rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-xl font-bold text-white flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary-400" /> New Supplier</Dialog.Title>
                  <button onClick={() => setIsSupplierModalOpen(false)}><X className="w-6 h-6 text-slate-500" /></button>
                </div>
                <form onSubmit={handleQuickAddSupplier} className="space-y-4">
                  <input type="text" required placeholder="Name" className="input-field" value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} />
                  <input type="tel" placeholder="Phone" className="input-field" value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} />
                  <button type="submit" disabled={addingSupplier} className="btn-primary w-full py-3 mt-4">{addingSupplier ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Supplier'}</button>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
