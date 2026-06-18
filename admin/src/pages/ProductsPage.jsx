import { useState, useEffect, useRef } from 'react'
import adminApi from '../services/adminApi'
import Button from '../components/shared/Button'
import { Package, X, Plus, Star } from 'lucide-react'

function ProductModal({ product, onClose, onSaved }) {
  const isEdit = !!product?.id
  const [form, setForm] = useState({
    name:          product?.name          || '',
    slug:          product?.slug          || '',
    subtitle:      product?.subtitle      || '',
    description:   product?.description   || '',
    tasting_notes: product?.tasting_notes || '',
    category_id:   product?.category_id   ?? product?.category?.id ?? '',
    base_price:    product?.base_price    || '',
    is_featured:   product?.is_featured   ?? false,
    is_limited:    product?.is_limited    ?? false,
    is_box_item:   product?.is_box_item   ?? false,
    off_peak_price: product?.off_peak_price || '',
  })
  const [categories, setCategories] = useState([])

  useEffect(() => {
    adminApi.get('/categories')
      .then(res => setCategories(res.data.categories || []))
      .catch(() => setCategories([]))
  }, [])
  const [variants,  setVariants]  = useState(
    product?.variants?.length
      ? product.variants.map(v => ({ ...v }))
      : [{ label: '4-Pack', price: '', stock_qty: '', is_default: true }]
  )
  const [items,     setItems]     = useState(product?.items?.map(i => i.label) || [''])
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(product?.images?.[0]?.url || null)
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState(null)
  const fileRef = useRef(null)

  const upd = field => e => {
    const val = e.target.value
    setForm(f => {
      const next = { ...f, [field]: val }
      if (field === 'name' && !isEdit) {
        next.slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      }
      return next
    })
  }
  const toggle = field => () => setForm(f => ({ ...f, [field]: !f[field] }))

  const handleImageChange = e => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const save = async () => {
    if (!form.name || !form.slug || !form.base_price) { setError('Name, slug, and base price are required.'); return }
    setSaving(true); setError(null)
    try {
      const payload = {
        ...form,
        category_id:   form.category_id ? parseInt(form.category_id) : null,
        base_price:    parseFloat(form.base_price),
        off_peak_price: form.off_peak_price ? parseFloat(form.off_peak_price) : null,
        variants: variants.map(v => ({ ...v, price: parseFloat(v.price), stock_qty: parseInt(v.stock_qty)||0 })),
        items: items.filter(Boolean),
      }

      let productId = product?.id
      if (isEdit) {
        await adminApi.put(`/admin/products/${productId}`, payload)
      } else {
        const r = await adminApi.post('/admin/products', payload)
        productId = r.data.product.id
      }

      // Upload image if selected
      if (imageFile && productId) {
        setUploading(true)
        const fd = new FormData()
        fd.append('image', imageFile)
        await adminApi.post(`/admin/products/${productId}/images`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      onSaved(); onClose()
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Save failed.')
    } finally { setSaving(false); setUploading(false) }
  }

  const inputSty = { background: '#0E0600', border: '1px solid rgba(184,117,42,0.2)', color: '#F2EAD8', fontSize: '13px' }
  const inputCls = 'w-full px-3 py-2.5 focus:outline-none transition-colors'

  return (
    // Fixed overlay — isolated stack so blur never depends on scroll position
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div className="flex min-h-full items-start justify-center p-4 py-8">
        <div className="relative w-full max-w-2xl" style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.3)' }}>

          {/* Header — sticky inside modal */}
          <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
            style={{ background: '#2A1200', borderBottom: '1px solid rgba(184,117,42,0.2)' }}>
            <h2 className="font-serif font-bold text-lg" style={{ color: '#F2EAD8' }}>
              {isEdit ? `Edit: ${product.name}` : 'Add New Product'}
            </h2>
            <button onClick={onClose} className="hover:opacity-60 transition" style={{ color: '#8C7355' }}>
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          <div className="p-6 space-y-5">

            {/* Image upload */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#8C7355' }}>
                Product Image
              </label>
              <div className="flex items-start gap-4">
                {imagePreview ? (
                  <div className="w-24 h-24 flex-shrink-0 overflow-hidden" style={{ border: '1px solid rgba(184,117,42,0.3)' }}>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center"
                    style={{ border: '1px dashed rgba(184,117,42,0.3)', background: '#1A0A00', color: '#8C7355' }}>
                    <Package size={32} strokeWidth={1.5} />
                  </div>
                )}
                <div>
                  <Button onClick={() => fileRef.current?.click()} variant="secondary" size="sm">
                    {imagePreview ? 'Change Image' : 'Upload Image'}
                  </Button>
                  <p className="text-[10px] mt-1.5" style={{ color: '#8C7355' }}>
                    JPEG, PNG or WebP · Max 5MB · Recommended 800×800
                  </p>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange} className="hidden" />
                </div>
              </div>
            </div>

            {/* Name + slug */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#8C7355' }}>Name *</label>
                <input value={form.name} onChange={upd('name')} placeholder="Venom" className={inputCls} style={inputSty} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#8C7355' }}>Slug *</label>
                <input value={form.slug} onChange={upd('slug')} placeholder="venom" className={inputCls} style={inputSty} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#8C7355' }}>Subtitle</label>
                <input value={form.subtitle} onChange={upd('subtitle')} placeholder="Chocolate Cookies" className={inputCls} style={inputSty} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#8C7355' }}>Category</label>
                <select value={form.category_id} onChange={upd('category_id')} className={inputCls} style={inputSty}>
                  <option value="">— Uncategorized —</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#8C7355' }}>Description</label>
              <textarea rows={3} value={form.description} onChange={upd('description')} className={`${inputCls} resize-none`} style={inputSty} />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#8C7355' }}>Tasting Notes</label>
              <textarea rows={2} value={form.tasting_notes} onChange={upd('tasting_notes')} className={`${inputCls} resize-none`} style={inputSty} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#8C7355' }}>Base Price (UGX) *</label>
                <input type="number" value={form.base_price} onChange={upd('base_price')} placeholder="5000" className={inputCls} style={inputSty} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#8C7355' }}>Off-Peak Price (Box only)</label>
                <input type="number" value={form.off_peak_price} onChange={upd('off_peak_price')} placeholder="80000"
                  className={inputCls} style={{ ...inputSty, opacity: form.is_box_item ? 1 : 0.4 }}
                  disabled={!form.is_box_item} />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex gap-6 flex-wrap">
              {[['is_featured','Featured'],['is_limited','Limited Edition'],['is_box_item','Box Item']].map(([k,l]) => (
                <label key={k} className="flex items-center gap-2 cursor-pointer">
                  <div onClick={toggle(k)}
                    className="relative w-9 h-5 rounded-full transition-colors"
                    style={{ background: form[k] ? '#B8752A' : '#3D2000' }}>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form[k] ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm" style={{ color: '#8C7355' }}>{l}</span>
                </label>
              ))}
            </div>

            {/* Variants */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8C7355' }}>Variants</label>
                <button onClick={() => setVariants(vs => [...vs, { label:'', price:'', stock_qty:'', is_default: false }])}
                  className="flex items-center gap-1 text-xs" style={{ color: '#B8752A' }}>
                  <Plus size={14} strokeWidth={1.5} /> Add
                </button>
              </div>
              {variants.map((v, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input value={v.label} onChange={e => setVariants(vs => vs.map((x,j) => j===i?{...x,label:e.target.value}:x))}
                    placeholder="Label" className="flex-1 px-3 py-2 text-sm focus:outline-none" style={inputSty} />
                  <input type="number" value={v.price} onChange={e => setVariants(vs => vs.map((x,j) => j===i?{...x,price:e.target.value}:x))}
                    placeholder="Price" className="w-24 px-3 py-2 text-sm focus:outline-none" style={inputSty} />
                  <input type="number" value={v.stock_qty} onChange={e => setVariants(vs => vs.map((x,j) => j===i?{...x,stock_qty:e.target.value}:x))}
                    placeholder="Stock" className="w-20 px-3 py-2 text-sm focus:outline-none" style={inputSty} />
                  <button onClick={() => setVariants(vs => vs.map((x,j) => ({...x,is_default:j===i})))}
                    className="px-2 py-1 text-xs font-bold" style={{ background: v.is_default ? '#B8752A' : '#3D2000', color: v.is_default ? '#1A0A00' : '#8C7355' }}>
                    <Star size={12} strokeWidth={1.5} fill={v.is_default ? 'currentColor' : 'none'} />
                  </button>
                  {variants.length > 1 && <button onClick={() => setVariants(vs => vs.filter((_,j) => j!==i))} className="text-red-400 text-sm px-1"><X size={14} strokeWidth={1.5} /></button>}
                </div>
              ))}
            </div>

            {/* Ingredients */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8C7355' }}>Ingredients</label>
                <button onClick={() => setItems(is => [...is, ''])} className="flex items-center gap-1 text-xs" style={{ color: '#B8752A' }}>
                  <Plus size={14} strokeWidth={1.5} /> Add
                </button>
              </div>
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input value={item} onChange={e => setItems(is => is.map((x,j) => j===i?e.target.value:x))}
                    placeholder={`Ingredient ${i+1}`} className="flex-1 px-3 py-2 text-sm focus:outline-none" style={inputSty} />
                  {items.length > 1 && <button onClick={() => setItems(is => is.filter((_,j) => j!==i))} className="text-red-400 text-sm px-1"><X size={14} strokeWidth={1.5} /></button>}
                </div>
              ))}
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 sticky bottom-0"
            style={{ background: '#2A1200', borderTop: '1px solid rgba(184,117,42,0.2)' }}>
            <Button onClick={onClose} variant="muted" size="sm">
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || uploading} loading={saving || uploading} variant="primary" size="sm">
              {uploading ? 'Uploading image…' : isEdit ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [reviews,  setReviews]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('products')
  const [modal,    setModal]    = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      adminApi.get('/admin/products'),
      adminApi.get('/admin/reviews?status=pending').catch(() => ({ data: { reviews: [] } })),
    ]).then(([p, r]) => {
      setProducts(p.data.products || [])
      setReviews(r.data.reviews || [])
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const toggleActive = async id => {
    try { await adminApi.patch(`/admin/products/${id}/toggle`); setProducts(ps => ps.map(p => p.id===id ? { ...p, is_active: !p.is_active } : p)) } catch {}
  }

  const approveReview = async id => {
    try { await adminApi.patch(`/admin/reviews/${id}`, { status: 'approved' }); setReviews(rs => rs.filter(r => r.id !== id)) } catch {}
  }
  const deleteReview = async id => {
    if (!confirm('Delete this review?')) return
    try { await adminApi.delete(`/admin/reviews/${id}`); setReviews(rs => rs.filter(r => r.id !== id)) } catch {}
  }

  const skel = (cols) => Array(5).fill(null).map((_,i) => (
    <tr key={i} style={{ borderBottom: '1px solid rgba(61,32,0,0.4)' }}>
      {Array(cols).fill(null).map((__,j) => <td key={j} className="px-4 py-4"><div className="h-2.5 rounded skeleton" style={{ background: '#3D2000', width: '70%' }} /></td>)}
    </tr>
  ))

  return (
    <div className="space-y-5 max-w-[1200px]">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 p-1" style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.2)' }}>
          {[{key:'products',label:'Products'},{key:'reviews',label:`Reviews${reviews.length>0?` (${reviews.length})`:''}`}].map(t => (
            <Button key={t.key} onClick={() => setTab(t.key)} variant={tab===t.key ? 'primary' : 'secondary'} size="sm" className="px-4">
              {t.label}
            </Button>
          ))}
        </div>
        {tab === 'products' && (
          <Button onClick={() => setModal('new')} variant="primary" size="sm">
            <Plus size={14} strokeWidth={1.5} /> Add Product
          </Button>
        )}
      </div>

      {tab === 'products' && (
        <div style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.2)', overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(61,32,0,0.8)' }}>
                  {['Product','Price','Stock','Flags','Status','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[9px] font-semibold text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? skel(6) : products.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(61,32,0,0.4)', opacity: p.is_active===false ? 0.5 : 1 }}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {p.images?.[0]?.url && (
                          <div className="w-10 h-10 flex-shrink-0 overflow-hidden" style={{ border: '1px solid rgba(184,117,42,0.2)' }}>
                            <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <p className="font-serif font-bold text-sm" style={{ color: '#F2EAD8' }}>{p.name}</p>
                          {p.subtitle && <p className="text-[10px]" style={{ color: '#8C7355' }}>{p.subtitle}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-medium whitespace-nowrap" style={{ color: '#F2EAD8' }}>
                      UGX {Number(p.base_price).toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      {p.variants?.map(v => (
                        <p key={v.id} className="text-[10px]" style={{ color: v.stock_qty > 0 ? '#4ade80' : '#f87171' }}>
                          {v.stock_qty > 0 ? `${v.stock_qty} in stock` : 'Out of stock'}
                        </p>
                      ))}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {p.is_featured && <span className="text-[9px] font-bold px-1.5 py-0.5" style={{ background: 'rgba(232,200,138,0.12)', color: '#E8C88A' }}>Featured</span>}
                        {p.is_limited  && <span className="text-[9px] font-bold px-1.5 py-0.5" style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7' }}>Limited</span>}
                        {p.is_box_item && <span className="text-[9px] font-bold px-1.5 py-0.5" style={{ background: 'rgba(184,117,42,0.12)', color: '#B8752A' }}>Box Item</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button onClick={() => toggleActive(p.id)}
                        className="text-[10px] font-bold px-2 py-1"
                        style={p.is_active !== false
                          ? { background: 'rgba(74,222,128,0.1)', color: '#4ade80' }
                          : { background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                        {p.is_active !== false ? '● Live' : '○ Hidden'}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <button onClick={() => setModal(p)} className="text-[10px] hover:underline" style={{ color: '#B8752A' }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'reviews' && (
        <div style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.2)', overflow: 'hidden' }}>
          {!loading && reviews.length === 0 ? (
            <div className="py-14 text-center">
              <p className="font-serif font-bold text-lg mb-1" style={{ color: '#F2EAD8' }}>No pending reviews</p>
              <p className="text-sm" style={{ color: '#8C7355' }}>All reviews have been moderated.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(61,32,0,0.8)' }}>
                    {['Product','Customer','Rating','Review','Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[9px] font-semibold text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? skel(5) : reviews.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(61,32,0,0.4)' }}>
                      <td className="px-4 py-4 text-xs font-medium" style={{ color: '#F2EAD8' }}>{r.product_name}</td>
                      <td className="px-4 py-4 text-xs" style={{ color: '#8C7355' }}>{r.name}</td>
                      <td className="px-4 py-4">
                        <div className="flex">{[1,2,3,4,5].map(s => <span key={s} style={{ color: r.rating>=s?'#B8752A':'#3D2000', fontSize:'12px' }}>★</span>)}</div>
                      </td>
                      <td className="px-4 py-4 text-xs max-w-xs" style={{ color: '#F2EAD8' }}>
                        <p className="line-clamp-2">{r.comment}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-3">
                          <Button onClick={() => approveReview(r.id)} size="sm" variant="primary" className="text-[10px]">Approve</Button>
                          <Button onClick={() => deleteReview(r.id)} size="sm" variant="danger" className="text-[10px]">Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modal && (
        <ProductModal
          product={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
