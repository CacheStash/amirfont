/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  ShieldCheck, 
  Key, 
  Copy, 
  RefreshCcw, 
  ShoppingBag, 
  UserCheck, 
  Mail, 
  MapPin, 
  AlertCircle, 
  CheckCircle,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CountryCombobox } from '../../components/CountryCombobox';
import { COUNTRIES, PROVINCES_BY_COUNTRY, findCountryByName, getCitiesForState, detectClientLocation } from '../../utils/affiliateGeo';
import { validateLegitEmail } from '../../lib/emailValidator';

const AccountSettings = () => {
  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Transaction Keys State
  const [checkoutCodes, setCheckoutCodes] = useState<string[]>([]);
  const [selectedCode, setSelectedCode] = useState('');

  // Profile Details State (Defaulted to US)
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('United States');
  const [stateProvince, setStateProvince] = useState('California');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [isAffiliate, setIsAffiliate] = useState(false);

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);
      const emailVal = user.email || '';
      setUserEmail(emailVal);
      setEditEmail(emailVal);

      // 1. Fetch from fontbuyer (User Profile & Base Address), fallback to user metadata
      const { data: buyer } = await supabase
        .from('fontbuyer')
        .select('full_name, address, email')
        .eq('id', user.id)
        .maybeSingle();

      const resolvedFullName = buyer?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || '';
      if (resolvedFullName) {
        setFullName(resolvedFullName);
      }

      if (buyer?.email && !emailVal) {
        setUserEmail(buyer.email);
        setEditEmail(buyer.email);
      }

      // 2. Fetch from affiliates to sync structured address if user is also an affiliate
      const { data: aff } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (aff) {
        setIsAffiliate(true);
        if (aff.country) setCountry(aff.country);
        if (aff.state_province) setStateProvince(aff.state_province);
        if (aff.city) setCity(aff.city);
        if (aff.postal_code) setPostalCode(aff.postal_code);
        if (aff.street_address) setStreetAddress(aff.street_address);
      } else if (buyer?.address) {
        setStreetAddress(buyer.address);
      } else {
        detectClientLocation().then(geo => {
          setCountry(prev => (prev === 'United States' ? geo.country : prev));
          if (geo.stateProvince) {
            setStateProvince(prev => (prev === 'California' ? geo.stateProvince : prev));
          }
        }).catch(() => {});
      }

      // 3. Fetch purchase history transaction codes
      const { data: history } = await supabase
        .from('font_history')
        .select('transaction_id')
        .eq('user_id', user.id)
        .order('download_date', { ascending: false });

      if (history && history.length > 0) {
        const codes = history.map((item: any) => item.transaction_id);
        setCheckoutCodes(codes);
        setSelectedCode(codes[0]);
      }
    };

    loadUserData();
  }, []);

  const handleCountryChange = (selectedCountry: string) => {
    setCountry(selectedCountry);
    const provinces = PROVINCES_BY_COUNTRY[selectedCountry];
    if (provinces && provinces.length > 0) {
      setStateProvince(provinces[0]);
    } else {
      setStateProvince('');
    }
    setCity('');
  };

  const handleCopy = () => {
    if (!selectedCode) return;
    navigator.clipboard.writeText(selectedCode);
    alert("KEY COPIED TO CLIPBOARD: " + selectedCode);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!fullName.trim()) {
      setProfileError('Full Name is required for commercial licensing.');
      return;
    }

    const cleanEmail = editEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setProfileError('Email address is required.');
      return;
    }

    // Layered Anti-Dummy Email Validation (Disposable domains, typos, live MX check)
    if (cleanEmail !== userEmail) {
      setProfileLoading(true);
      const emailCheck = await validateLegitEmail(cleanEmail);
      if (!emailCheck.isValid) {
        setProfileLoading(false);
        setProfileError(emailCheck.message || 'DISPOSABLE OR INVALID EMAIL DETECTED. PLEASE PROVIDE A REAL INBOX.');
        return;
      }
    }

    setProfileLoading(true);

    try {
      const fullAddress = [
        streetAddress.trim(),
        city.trim(),
        [stateProvince.trim(), postalCode.trim()].filter(Boolean).join(' '),
        country.trim()
      ].filter(Boolean).join(', ');

      // 1. Update fontbuyer profile
      const { error: buyerError } = await supabase
        .from('fontbuyer')
        .upsert({
          id: currentUser.id,
          email: cleanEmail,
          full_name: fullName.trim(),
          address: fullAddress
        });

      if (buyerError) throw buyerError;

      // 2. Two-Way Sync: If user is also an affiliate, sync structured address to affiliates table
      if (isAffiliate) {
        await supabase
          .from('affiliates')
          .update({
            country: country.trim(),
            state_province: stateProvince.trim(),
            city: city.trim(),
            postal_code: postalCode.trim(),
            street_address: streetAddress.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', currentUser.id);
      }

      // 3. Update Supabase Auth user metadata & login credential if changed
      const authUpdatePayload: any = { data: { full_name: fullName.trim() } };
      if (cleanEmail !== userEmail) {
        authUpdatePayload.email = cleanEmail;
      }
      const { error: authError } = await supabase.auth.updateUser(authUpdatePayload);
      if (authError) throw authError;

      if (cleanEmail !== userEmail) {
        setUserEmail(cleanEmail);
        setProfileSuccess('PROFILE & LOGIN EMAIL UPDATED. FUTURE LICENSES WILL REFLECT THIS INFO, AND YOU CAN RE-DOWNLOAD CERTIFICATES IN PURCHASE HISTORY.');
      } else {
        setProfileSuccess('PROFILE & BILLING DETAILS UPDATED SUCCESSFULLY. FUTURE LICENSES WILL REFLECT THIS INFO.');
      }
    } catch (err: any) {
      setProfileError(err.message || 'FAILED TO UPDATE PROFILE.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError("PASSWORDS DO NOT MATCH!");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("PASSWORD MUST BE AT LEAST 6 CHARACTERS.");
      return;
    }

    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess("PASSWORD UPDATED SUCCESSFULLY!");
      setNewPassword('');
      setConfirmPassword('');
    }
    setPasswordLoading(false);
  };

  const provinceOptions = PROVINCES_BY_COUNTRY[country] || [];
  const cityOptions = getCitiesForState(country, stateProvince);

  return (
    <div className="max-w-2xl font-mono space-y-10 uppercase pb-20">
      
      {/* 1. PURCHASER & BILLING PROFILE CARD */}
      <div className="p-6 border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-4">
          <div className="flex items-center gap-2">
            <UserCheck size={18} className="text-[#FF5C00]" />
            <h3 className="text-sm font-black tracking-wider text-black">
              PURCHASER & BILLING PROFILE
            </h3>
          </div>
          {isAffiliate && (
            <span className="text-[9px] font-black tracking-widest px-2 py-0.5 bg-[#FF5C00] text-black border border-black self-start sm:self-auto">
              AFFILIATE_SYNCED
            </span>
          )}
        </div>

        {/* Informative Guidance Banner */}
        <div className="p-4 bg-gray-50 border-2 border-black text-xs font-mono normal-case space-y-2">
          <div className="flex items-start gap-2">
            <FileText size={16} className="text-[#FF5C00] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-black uppercase font-mono">License Updates:</strong> Any changes to your Full Name or Billing Address will automatically apply to future licenses. You can also re-download past font packages and updated license certificates anytime from <Link to="/dashboard" onClick={() => window.location.hash = 'library'} className="underline font-bold text-[#FF5C00]">Purchase History</Link>.
            </p>
          </div>
          <div className="flex items-start gap-2 pt-2 border-t border-black/10">
            <Mail size={16} className="text-[#FF5C00] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-black uppercase font-mono">Login Username:</strong> Your email address serves as your account login username. If changed, your old email will immediately become invalid for signing in.
            </p>
          </div>
        </div>

        {profileSuccess && (
          <div className="p-4 bg-emerald-50 border-2 border-black text-emerald-900 text-xs font-black flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-700 shrink-0" />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div className="p-4 bg-red-50 border-2 border-black text-red-900 text-xs font-black flex items-center gap-2">
            <AlertCircle size={16} className="text-red-700 shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-black block tracking-wider">
                LEGAL FULL NAME *
              </label>
              <input 
                type="text" 
                value={fullName} 
                onChange={e => setFullName(e.target.value.replace(/\b\w/g, l => l.toUpperCase()))} 
                placeholder="JOHNATHAN DOE" 
                required 
                className="w-full border-2 border-black p-3 bg-white outline-none font-bold text-xs focus:bg-yellow-50 text-black"
              />
              <span className="text-[9px] text-gray-500 normal-case block">
                Printed on commercial license certificates.
              </span>
            </div>

            {/* Email / Username */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-black block tracking-wider">
                ACCOUNT EMAIL / USERNAME *
              </label>
              <input 
                type="email" 
                value={editEmail} 
                onChange={e => setEditEmail(e.target.value.toLowerCase())} 
                placeholder="NAME@DOMAIN.COM" 
                required 
                className="w-full border-2 border-black p-3 bg-white outline-none font-bold text-xs focus:bg-yellow-50 text-black lowercase"
              />
              <span className="text-[9px] text-gray-500 normal-case block">
                Used to log in. Anti-dummy email verification active.
              </span>
            </div>
          </div>

          {/* Structured Address */}
          <div className="p-4 border-2 border-black bg-gray-50 space-y-3">
            <span className="text-[10px] font-black text-[#FF5C00] block flex items-center gap-1.5 tracking-wider">
              <MapPin size={12} /> COMMERCIAL BILLING ADDRESS
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-black block">COUNTRY</label>
                <CountryCombobox 
                  value={country} 
                  onChange={(c) => handleCountryChange(c)}
                  theme="brutalist"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-black block">STATE / PROVINCE</label>
                {provinceOptions.length > 0 ? (
                  <select
                    value={stateProvince}
                    onChange={(e) => setStateProvince(e.target.value)}
                    className="w-full p-2.5 border-2 border-black bg-white font-mono text-xs font-bold outline-none cursor-pointer text-black"
                  >
                    {provinceOptions.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    value={stateProvince}
                    onChange={(e) => setStateProvince(e.target.value)}
                    placeholder="STATE / PROVINCE" 
                    className="w-full p-2.5 border-2 border-black bg-white font-mono text-xs font-bold outline-none text-black"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-black block">CITY</label>
                <input 
                  type="text" 
                  list="subqi-account-city-list"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. San Francisco" 
                  className="w-full p-2.5 border-2 border-black bg-white font-mono text-xs font-bold outline-none text-black"
                />
                {cityOptions.length > 0 && (
                  <datalist id="subqi-account-city-list">
                    {cityOptions.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-black block">POSTAL / ZIP</label>
                <input 
                  type="text" 
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="e.g. 94105" 
                  className="w-full p-2.5 border-2 border-black bg-white font-mono text-xs font-bold outline-none text-black"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-black block">STREET ADDRESS</label>
              <input 
                type="text" 
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="e.g. 525 Market St, Suite 3200" 
                className="w-full p-2.5 border-2 border-black bg-white font-mono text-xs font-bold outline-none text-black"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={profileLoading} 
            className="w-full p-3.5 bg-black text-white border-2 border-black font-black text-xs hover:bg-[#FF5C00] hover:text-black transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] flex items-center justify-center gap-2"
          >
            {profileLoading ? (
              <RefreshCcw className="animate-spin" size={16} />
            ) : (
              <>
                <UserCheck size={16} /> SAVE_PROFILE_&_BILLING_DETAILS
              </>
            )}
          </button>
        </form>
      </div>

      {/* 2. TRANSACTION KEYS */}
      <div className="p-6 border-2 border-black bg-yellow-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <label className="block text-[10px] font-black tracking-widest mb-2 opacity-50 flex items-center gap-2">
          <Key size={12} /> YOUR_CHECKOUT_CODES & RESETTER_KEYS
        </label>
        {checkoutCodes.length > 0 ? (
          <>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <select 
                  value={selectedCode}
                  onChange={(e) => setSelectedCode(e.target.value)}
                  className="w-full text-base font-black tracking-tighter bg-white border border-black p-3 outline-none appearance-none cursor-pointer focus:bg-white"
                >
                  {checkoutCodes.map((code: string, idx: number) => (
                    <option key={idx} value={code}>{code}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none font-black text-xs">
                  ▼
                </div>
              </div>
              
              <button 
                type="button"
                onClick={handleCopy}
                className="bg-black text-white px-4 border-2 border-black font-black text-[10px] hover:bg-white hover:text-black transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
              >
                COPY
              </button>
            </div>

            <p className="text-[9px] mt-3 font-bold opacity-60 leading-tight">
              * ALL CODES LISTED ABOVE ARE VALID RESETTER KEYS.
              <br />
              * IF YOU FORGET YOUR CUSTOM PASSWORD, USE ANY OF THESE TRANSACTION CODES TO REGAIN ACCESS VIA LOGIN PAGE.
            </p>
          </>
        ) : (
          <div className="p-4 border-2 border-dashed border-black bg-white text-center space-y-3">
            <p className="text-xs font-black text-black">NO PURCHASE KEYS RECORDED</p>
            <p className="text-[10px] text-gray-600 font-sans normal-case font-bold leading-relaxed">
              You haven't bought any fonts on this account yet. License typefaces to unlock permanent direct downloads and license accession keys.
            </p>
            <div>
              <Link 
                to="/fonts" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white border-2 border-black font-black text-xs hover:bg-[#FF5C00] hover:text-black transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                <ShoppingBag size={14} /> BUY FONTS NOW
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 3. CHANGE PASSWORD */}
      <div className="p-6 border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-3">
          <label className="text-xs font-black tracking-widest text-black flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#FF5C00]" /> UPDATE_PASSWORD
          </label>
          {userEmail && (
            <span className="text-[10px] font-mono text-black font-bold bg-gray-100 px-2 py-0.5 border border-black self-start sm:self-auto lowercase">
              {userEmail}
            </span>
          )}
        </div>

        {passwordSuccess && (
          <div className="p-3 bg-emerald-50 border-2 border-black text-emerald-900 text-xs font-black flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-700 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 bg-red-50 border-2 border-black text-red-900 text-xs font-black flex items-center gap-2">
            <AlertCircle size={14} className="text-red-700 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-[9px] font-black mb-1 opacity-60">NEW_PASSWORD</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 font-bold border-2 border-black text-sm outline-none focus:bg-yellow-50"
              placeholder="••••••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-[9px] font-black mb-1 opacity-60">CONFIRM_NEW_PASSWORD</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 font-bold border-2 border-black text-sm outline-none focus:bg-yellow-50"
              placeholder="••••••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={passwordLoading}
            className="w-full p-3.5 bg-black text-white border-2 border-black font-black text-xs hover:bg-[#FF5C00] hover:text-black transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] flex items-center justify-center gap-2"
          >
            {passwordLoading ? (
              <RefreshCcw className="animate-spin" size={16} />
            ) : (
              <>
                <ShieldCheck size={16} /> COMMIT_NEW_PASSWORD
              </>
            )}
          </button>
        </form>
      </div>

    </div>
  );
};

export default AccountSettings;