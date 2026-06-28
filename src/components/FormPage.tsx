/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { WasteCategory } from '../types';
import ConfirmationMap from './ConfirmationMap';
import { 
  Leaf, 
  Trash2, 
  MapPin, 
  Cpu, 
  Layers, 
  HelpCircle, 
  Sparkles, 
  Compass, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  Wrench,
  Camera,
  Upload,
  X,
  Image as ImageIcon,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FormPageProps {
  onSuccess: () => void;
  onSubmittingStateChange?: (isSubmitting: boolean) => void;
  onViewDashboard?: () => void;
}

// Client-side image compression helper to keep base64 payloads light and highly compatible with Firestore limits
// Uses URL.createObjectURL to avoid allocating massive base64 strings in memory on mobile devices
const compressImageFile = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.75): Promise<string> => {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      // Clean up object URL immediately to release memory
      URL.revokeObjectURL(objectUrl);

      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback to FileReader if canvas is not available
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
        return;
      }

      // Draw and export compressed JPEG
      ctx.drawImage(img, 0, 0, width, height);
      try {
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      } catch (err) {
        console.error("Canvas export failed, falling back:", err);
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Fallback to FileReader if image element fails to load object URL
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
};

const CATEGORIES: { value: WasteCategory; label: string; icon: React.ReactNode; color: string; bg: string; border: string; description: string }[] = [
  { 
    value: 'Plastic', 
    label: 'Plastic', 
    icon: <Layers className="w-5 h-5 text-sky-500" />, 
    color: 'text-sky-700', 
    bg: 'bg-sky-50/70 hover:bg-sky-50', 
    border: 'border-sky-200 focus:border-sky-500',
    description: 'Bottles, packaging, single-use containers'
  },
  { 
    value: 'E-Waste', 
    label: 'E-Waste', 
    icon: <Cpu className="w-5 h-5 text-indigo-500" />, 
    color: 'text-indigo-700', 
    bg: 'bg-indigo-50/70 hover:bg-indigo-50', 
    border: 'border-indigo-200 focus:border-indigo-500',
    description: 'Electronics, cables, batteries, components'
  },
  { 
    value: 'Organic', 
    label: 'Organic', 
    icon: <Leaf className="w-5 h-5 text-emerald-500" />, 
    color: 'text-emerald-700', 
    bg: 'bg-emerald-50/70 hover:bg-emerald-50', 
    border: 'border-emerald-200 focus:border-emerald-500',
    description: 'Food scraps, yard waste, compostables'
  },
  { 
    value: 'Metal', 
    label: 'Metal', 
    icon: <Wrench className="w-5 h-5 text-slate-500" />, 
    color: 'text-slate-700', 
    bg: 'bg-slate-100/70 hover:bg-slate-100', 
    border: 'border-slate-300 focus:border-slate-500',
    description: 'Aluminium cans, steel, iron wires'
  },
  { 
    value: 'Other', 
    label: 'Other', 
    icon: <HelpCircle className="w-5 h-5 text-amber-500" />, 
    color: 'text-amber-700', 
    bg: 'bg-amber-50/70 hover:bg-amber-50', 
    border: 'border-amber-200 focus:border-amber-500',
    description: 'Mixed landfill, textiles, composite materials'
  }
];

export default function FormPage({ onSuccess, onSubmittingStateChange, onViewDashboard }: FormPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<WasteCategory | null>(null);
  const [weight, setWeight] = useState<string>('');
  const [unit, setUnit] = useState<'g' | 'kg' | 'lbs'>('kg');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loadingState, setLoadingState] = useState<'idle' | 'geolocation' | 'saving'>('idle');
  const [isCompressingImage, setIsCompressingImage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedLog, setSubmittedLog] = useState<{
    category: WasteCategory;
    weight: number;
    unit: 'g' | 'kg' | 'lbs';
    weightInKg: number;
    latitude: number;
    longitude: number;
    imageUrl?: string;
  } | null>(null);

  // Helper wrapper to coordinate loadingState changes with parent components for tab-locking
  const updateLoadingState = (state: 'idle' | 'geolocation' | 'saving') => {
    setLoadingState(state);
    if (onSubmittingStateChange) {
      onSubmittingStateChange(state !== 'idle');
    }
  };

  const handleReset = () => {
    setCategory(null);
    setWeight('');
    setUnit('kg');
    setImageUrl('');
    updateLoadingState('idle');
    setError(null);
    setSubmittedLog(null);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check pre-compression size limit (allow much larger since we compress it to < 100KB anyway)
    if (file.size > 30 * 1024 * 1024) {
      setError('Image is too large. Please select an image smaller than 30MB.');
      return;
    }

    setIsCompressingImage(true);
    setError(null);

    try {
      // Perform highly memory-efficient client-side canvas-based downscaling and compression
      const compressedBase64 = await compressImageFile(file);
      if (compressedBase64) {
        setImageUrl(compressedBase64);
      } else {
        throw new Error('Could not process image data');
      }
    } catch (err) {
      console.error("Compression error:", err);
      setError('Failed to process and compress selected image. Please try another photo.');
    } finally {
      setIsCompressingImage(false);
      // Reset file input value to allow selecting the same image again if needed
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCompressingImage) {
      setError('Please wait while your image is being processed.');
      return;
    }
    if (!category) {
      setError('Please select a waste category.');
      return;
    }
    const parsedWeight = parseFloat(weight);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      setError(`Please enter a valid weight greater than 0 ${unit}.`);
      return;
    }

    setError(null);
    updateLoadingState('geolocation');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      updateLoadingState('idle');
      return;
    }

    // Capture location via Geolocation API
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        updateLoadingState('saving');

        // Convert weight to kg for ledger uniformity
        let weightInKg = parsedWeight;
        if (unit === 'g') {
          weightInKg = parsedWeight / 1000;
        } else if (unit === 'lbs') {
          weightInKg = parsedWeight * 0.45359237;
        }

        try {
          // Add document to Firestore 'waste_logs' collection
          await addDoc(collection(db, 'waste_logs'), {
            category,
            weight: parsedWeight,
            unit,
            weightInKg,
            latitude,
            longitude,
            imageUrl: imageUrl || '',
            timestamp: serverTimestamp(),
            userId: auth.currentUser?.uid || 'anonymous',
            userEmail: auth.currentUser?.email || 'Guest'
          });

          // Show success state
          setSubmittedLog({
            category,
            weight: parsedWeight,
            unit,
            weightInKg,
            latitude,
            longitude,
            imageUrl: imageUrl || undefined
          });
          updateLoadingState('idle');
          onSuccess(); // Triggers update signal in parent
        } catch (err: any) {
          console.error("Firestore Error:", err);
          setError(`Failed to save log to database: ${err.message || 'Unknown error'}`);
          updateLoadingState('idle');
        }
      },
      (geoError) => {
        console.warn("Geolocation Error:", geoError);
        updateLoadingState('idle');
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setError('Location permission denied. Please allow location access to submit this eco audit.');
            break;
          case geoError.POSITION_UNAVAILABLE:
            setError('Location information is currently unavailable. Please verify GPS/Network signals.');
            break;
          case geoError.TIMEOUT:
            setError('The request to acquire your location timed out. Please try again.');
            break;
          default:
            setError('An unknown error occurred while retrieving your physical coordinates.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="max-w-6xl mx-auto" id="waste-logger-form-container">
      <AnimatePresence mode="wait">
        {submittedLog ? (
          <motion.div
            key="success-screen"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full space-y-6 animate-fade-in"
          >
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
              {/* Top border colored accent */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-600" />
              
              <div className="flex flex-col lg:flex-row gap-8 items-stretch">
                {/* Details and Actions Column */}
                <div className="lg:w-1/3 flex flex-col justify-between space-y-6 shrink-0">
                  <div className="space-y-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 shadow-xs">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
                      Audit Logged Successfully!
                    </h2>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Your eco audit has been synchronized with the community database and stamped with verified GPS coordinates.
                    </p>
                  </div>

                  {/* Data Summary Card */}
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-4.5 space-y-4">
                    <div className="flex justify-between items-center text-xs pb-3 border-b border-stone-200/60">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Waste Type</span>
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        {CATEGORIES.find(c => c.value === submittedLog.category)?.icon}
                        {submittedLog.category}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs pb-3 border-b border-stone-200/60">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Weight</span>
                      <span className="font-extrabold text-slate-900 text-sm text-right">
                        <div>{submittedLog.weight.toFixed(2)} {submittedLog.unit}</div>
                        {submittedLog.unit !== 'kg' && (
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                            ({submittedLog.weightInKg.toFixed(3)} kg eq.)
                          </div>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-start text-xs pb-3 border-b border-stone-200/60">
                      <span className="text-slate-400 font-bold uppercase tracking-wider mt-0.5">Location</span>
                      <span className="font-mono text-slate-700 text-right bg-white border border-stone-200 px-2 py-1 rounded">
                        Lat: {submittedLog.latitude.toFixed(5)}<br />
                        Lng: {submittedLog.longitude.toFixed(5)}
                      </span>
                    </div>

                    {submittedLog.imageUrl && (
                      <div className="space-y-1.5">
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Verified Proof of Disposal</span>
                        <div className="relative rounded-lg overflow-hidden border border-stone-200 aspect-video bg-stone-100">
                          <img 
                            src={submittedLog.imageUrl} 
                            alt="Disposal proof" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 space-y-2.5">
                    <button
                      type="button"
                      id="log-another-btn"
                      onClick={handleReset}
                      className="w-full py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-200/40 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      Log Another Entry
                    </button>
                    {onViewDashboard && (
                      <button
                        type="button"
                        id="view-dashboard-btn"
                        onClick={onViewDashboard}
                        className="w-full py-3 px-5 bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 active:scale-[0.98] transition-all text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <BarChart3 className="w-4 h-4 text-emerald-600" />
                        View Ledger Dashboard
                      </button>
                    )}
                  </div>
                </div>

                {/* Stunning Map Column */}
                <div className="flex-1 min-h-[450px]">
                  <ConfirmationMap
                    latitude={submittedLog.latitude}
                    longitude={submittedLog.longitude}
                    category={submittedLog.category}
                    weight={submittedLog.weight}
                    unit={submittedLog.unit}
                    imageUrl={submittedLog.imageUrl}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Side: Form */}
            <div className="lg:col-span-2">
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                    <Leaf className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
                      Log Waste Entry
                    </h2>
                    <p className="text-slate-400 text-xs">
                      Log disposed waste materials securely with automated coordinates
                    </p>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs flex items-start gap-3"
                    id="form-error-banner"
                  >
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-bold block mb-0.5">Audit Submission Failed</span>
                      <p className="text-[11px] text-rose-700/90 leading-relaxed">{error}</p>
                    </div>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Category Selector */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                      1. Select Waste Category <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" id="category-grid">
                      {CATEGORIES.map((cat) => {
                        const isSelected = category === cat.value;
                        return (
                          <button
                            key={cat.value}
                            type="button"
                            id={`category-btn-${cat.value.toLowerCase()}`}
                            onClick={() => {
                              setCategory(cat.value);
                              setError(null);
                            }}
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-all relative overflow-hidden group cursor-pointer ${
                              isSelected 
                                ? 'border-emerald-500 bg-emerald-50/30 shadow-xs ring-2 ring-emerald-500/5' 
                                : 'border-stone-200 hover:border-stone-300 bg-stone-50/40'
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg transition-transform duration-200 shrink-0 ${
                              isSelected ? 'bg-white shadow-xs scale-105' : 'bg-white border border-stone-100'
                            }`}>
                              {cat.icon}
                            </div>
                            <div className="flex-1 min-w-0 pr-4">
                              <span className={`block font-bold text-xs leading-tight ${
                                isSelected ? 'text-emerald-950' : 'text-slate-800'
                              }`}>
                                {cat.label}
                              </span>
                              <span className="block text-slate-400 text-[10px] leading-tight mt-0.5 truncate">
                                {cat.description}
                              </span>
                            </div>
                            
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Weight Input with Segmented Control */}
                  <div id="weight-input-container" className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label htmlFor="weight" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        2. Weight of Waste <span className="text-rose-500">*</span>
                      </label>
                      
                      {/* Segmented Unit Buttons */}
                      <div className="flex bg-stone-100/80 p-0.5 rounded-lg border border-stone-200/60" id="unit-selector">
                        {(['g', 'kg', 'lbs'] as const).map((u) => {
                          const isSelected = unit === u;
                          return (
                            <button
                              key={u}
                              type="button"
                              onClick={() => {
                                setUnit(u);
                                setError(null);
                              }}
                              className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-white text-emerald-700 shadow-xs border border-stone-200/40'
                                  : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              {u === 'g' ? 'g' : u === 'kg' ? 'kg' : 'lbs'}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="relative rounded-xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Compass className="w-5 h-5 text-slate-400" />
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        name="weight"
                        id="weight"
                        value={weight}
                        onChange={(e) => {
                          setWeight(e.target.value);
                          setError(null);
                        }}
                        placeholder={unit === 'g' ? '500' : '0.00'}
                        disabled={loadingState !== 'idle'}
                        className="block w-full h-12 pl-11 pr-16 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-stone-50/40 text-sm font-medium transition-all"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <span className="text-[10px] font-bold text-slate-400 uppercase bg-stone-100 px-2.5 py-1 rounded-md border border-stone-200/50">
                          {unit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Proof of Disposal Upload */}
                  <div className="space-y-3" id="proof-of-disposal-container">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      3. Verified Proof of Disposal <span className="text-slate-400 font-normal lowercase">(Optional)</span>
                    </label>
                    
                    {isCompressingImage ? (
                      <div className="border border-stone-200 bg-stone-50/50 rounded-2xl p-6 text-center flex flex-col items-center justify-center space-y-3 min-h-[120px] animate-pulse">
                        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">Optimizing & Compressing Photo...</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Formatting to lightweight layout for instant community ledger sync</span>
                        </div>
                      </div>
                    ) : !imageUrl ? (
                      <div 
                        className="border-2 border-dashed border-stone-200 hover:border-emerald-500/50 hover:bg-stone-50/10 bg-stone-50/30 rounded-2xl p-6 transition-all text-center group relative min-h-[140px] flex items-center justify-center cursor-pointer"
                        title="Click to select file or take photo"
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleImageChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          id="proof-image-file-input"
                        />
                        <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none relative z-0">
                          <div className="p-3 bg-white border border-stone-100 rounded-xl text-stone-400 group-hover:text-emerald-600 group-hover:scale-105 transition-all shadow-xs">
                            <Camera className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-700 block">Take photo or upload image</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Supports high-res camera photos up to 30MB</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative rounded-2xl border border-stone-200 overflow-hidden aspect-video bg-stone-50 group">
                        <img 
                          src={imageUrl} 
                          alt="Proof of Disposal Preview" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setImageUrl('')}
                            className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            title="Remove Photo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Loader and Action */}
                  <div className="pt-2">
                    {loadingState === 'geolocation' && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl mb-4 flex items-center gap-3.5"
                        id="geolocation-loader-feedback"
                      >
                        <Loader2 className="w-5 h-5 text-emerald-600 animate-spin shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-emerald-950 block">Requesting Geolocation</span>
                          <p className="text-[11px] text-emerald-700/90 leading-tight">Please accept the browser location permission pop-up if prompted...</p>
                        </div>
                      </motion.div>
                    )}

                    {loadingState === 'saving' && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 bg-blue-50 border border-blue-100 rounded-xl mb-4 flex items-center gap-3.5"
                        id="saving-loader-feedback"
                      >
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-blue-950 block">Connecting to Firestore</span>
                          <p className="text-[11px] text-blue-700/90 leading-tight">Uploading audited log to the community ledger database...</p>
                        </div>
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      id="submit-audit-btn"
                      disabled={loadingState !== 'idle'}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-100 disabled:text-stone-400 active:scale-[0.99] transition-all text-white font-bold rounded-xl shadow-lg shadow-emerald-200/40 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed text-xs uppercase tracking-wider"
                    >
                      {loadingState !== 'idle' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Capturing & Uploading...
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4" />
                          Capture & Submit
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>

            {/* Right Side: Geometric Information sidebar */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {/* Active Geotagging Panel */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-emerald-500 rounded-full"></span>
                  Active Geotagging
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  EcoAudit secures localized tracking logs by calling the browser's high-accuracy <span className="font-semibold text-emerald-700">geolocation sensor</span> only when you click submit. No manual location typing is needed.
                </p>
                <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-100/60 rounded-xl">
                  <p className="text-xs leading-normal text-emerald-800 flex gap-2">
                    <Compass className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    <span>Make sure to grant permission when requested in your browser.</span>
                  </p>
                </div>
              </div>

              {/* Sorting Guide Card */}
              <div className="bg-emerald-950 rounded-2xl p-6 text-emerald-100 overflow-hidden relative shadow-sm border border-emerald-900">
                <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl"></div>
                <div className="relative z-10 space-y-4">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-400">Ledger Compliance</span>
                    <h3 className="text-sm font-bold text-white mt-1">Sorting Quick Tips</h3>
                  </div>
                  
                  <ul className="text-[11px] text-emerald-200/90 space-y-2.5 list-none pl-0">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span><strong>Plastic:</strong> Clean all food residue off containers before sorting to enable high-quality recycling.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span><strong>Organic:</strong> Keep compostable items free of plastics, stickers, or metal twist ties.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span><strong>E-Waste:</strong> Batteries, chargers, and dead circuitry belong exclusively to certified collection runs.</span>
                    </li>
                  </ul>
                  <p className="text-[10px] text-emerald-400 font-medium italic pt-1">Every localized record builds real transparent impact.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
