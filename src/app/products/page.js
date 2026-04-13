'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [imageFiles, setImageFiles] = useState([])
  const [formData, setFormData] = useState({
    product_name: '',
    original_price: '',
    discounted_price: '',
    discounted_percentage: 0,
    images: [],
    category_id: '',
    stock: '',
    short_description: '',
    long_description: ''
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState({ total: 0, pages: 0 })

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [searchTerm, sortBy, sortOrder, page, limit])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/categories?_t=${Date.now()}`, { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to fetch categories')
      }
    } catch (error) {
      toast.error('Failed to fetch categories')
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchTerm,
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: limit.toString()
      })
      const response = await fetch(`/api/products?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || data)
        if (data.pagination) setPagination(data.pagination)
      }
    } catch (error) {
      toast.error('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        product_name: product.product_name || '',
        original_price: product.original_price || '',
        discounted_price: product.discounted_price || '',
        discounted_percentage: product.discounted_percentage || 0,
        images: product.images || [],
        category_id: product.category_id?.id || product.category_id || '',
        stock: product.stock || '',
        short_description: product.short_description || '',
        long_description: product.long_description || ''
      })
      setImageFiles([])
    } else {
      setEditingProduct(null)
      setFormData({
        product_name: '',
        original_price: '',
        discounted_price: '',
        discounted_percentage: 0,
        images: [],
        category_id: '',
        stock: '',
        short_description: '',
        long_description: ''
      })
      setImageFiles([])
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    setUploadingImages(false)
    setImageFiles([])
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    try {
      setUploadingImages(true)
      const base64Promises = files.map(file => new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      }))
      const base64Images = await Promise.all(base64Promises)
      setFormData({ ...formData, images: [...(formData.images || []), ...base64Images] })
      setImageFiles([...imageFiles, ...files])
      toast.success(`${files.length} image(s) selected`)
    } catch {
      toast.error('Failed to read images')
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (index) => {
    const imageToRemove = formData.images[index]
    if (!imageToRemove.startsWith('data:')) {
      fetch('/api/cloudinary/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrls: [imageToRemove] })
      }).catch(() => { })
    }
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) })
    setImageFiles(imageFiles.filter((_, i) => i !== index))
  }

  const calculateDiscountPercentage = (original, discounted) => {
    if (!original || !discounted || original <= 0) return 0
    return Math.round(((original - discounted) / original) * 100)
  }

  const handlePriceChange = (field, value) => {
    const updatedFormData = { ...formData, [field]: parseFloat(value) || 0 }
    if (updatedFormData.original_price && updatedFormData.discounted_price) {
      updatedFormData.discounted_percentage = calculateDiscountPercentage(
        updatedFormData.original_price,
        updatedFormData.discounted_price
      )
    }
    setFormData(updatedFormData)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!editingProduct && imageFiles.length === 0) {
      toast.error('Please upload at least one image')
      return
    }
    try {
      setUploadingImages(true)
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'
      const submitFormData = new FormData()
      submitFormData.append('product_name', formData.product_name)
      submitFormData.append('original_price', formData.original_price)
      submitFormData.append('discounted_price', formData.discounted_price)
      submitFormData.append('discounted_percentage', formData.discounted_percentage)
      submitFormData.append('category_id', formData.category_id)
      submitFormData.append('stock', formData.stock)
      submitFormData.append('short_description', formData.short_description)
      submitFormData.append('long_description', formData.long_description)
      submitFormData.append('existingImages', JSON.stringify(formData.images.filter(img => !img.startsWith('data:'))))
      imageFiles.forEach(file => submitFormData.append('images', file))
      const response = await fetch(url, { method, body: submitFormData })
      if (response.ok) {
        await fetchProducts()
        closeModal()
        toast.success(editingProduct ? 'Product updated successfully!' : 'Product added successfully!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save product')
      }
    } catch {
      toast.error('Failed to save product')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchProducts()
        toast.success('Product deleted successfully!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete product')
      }
    } catch {
      toast.error('Failed to delete product')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <span className="ml-1 text-gray-400 text-xs">⇅</span>
    return sortOrder === 'asc'
      ? <span className="ml-1 text-indigo-600 text-xs">↑</span>
      : <span className="ml-1 text-indigo-600 text-xs">↓</span>
  }

  // Pagination page numbers with window of 5
  const getPageNumbers = () => {
    const total = pagination.pages
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
    let start = Math.max(1, page - 2)
    let end = Math.min(total, start + 4)
    if (end - start < 4) start = Math.max(1, end - 4)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Sidebar activePage="products" />

      <main className="ml-72 flex flex-col min-h-screen">
        <Header title="Products" subtitle="Manage your jewelry products" />

        <div className="p-8">
          <div className="flex justify-end mb-6">
            <button
              onClick={() => openModal()}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Product
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 mb-6">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 text-sm"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th
                      onClick={() => handleSort('product_name')}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      Product <SortIcon field="product_name" />
                    </th>
                    <th
                      onClick={() => handleSort('discounted_price')}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      Price <SortIcon field="discounted_price" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Discount
                    </th>
                    <th
                      onClick={() => handleSort('category_id')}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      Category <SortIcon field="category_id" />
                    </th>
                    <th
                      onClick={() => handleSort('stock')}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      Stock <SortIcon field="stock" />
                    </th>
                    <th
                      onClick={() => handleSort('createdAt')}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      Created <SortIcon field="createdAt" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
                          <p className="text-sm text-gray-500">Loading products...</p>
                        </div>
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <p className="text-gray-600 font-medium">No products found</p>
                        <p className="text-gray-500 text-sm mt-1">
                          {searchTerm ? 'Try a different search term' : 'Add your first product to get started'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded border border-gray-200 shrink-0 overflow-hidden bg-gray-100 flex items-center justify-center">
                              {product.images && product.images.length > 0 ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.product_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{product.product_name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{product.short_description?.substring(0, 40)}...</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-sm font-medium text-gray-900">${product.discounted_price}</p>
                          {product.original_price > product.discounted_price && (
                            <p className="text-xs text-gray-500 line-through">${product.original_price}</p>
                          )}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                            {product.discounted_percentage}% off
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {product.category_id?.name || 'N/A'}
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          {product.stock === 0 ? (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700">
                              Out of stock
                            </span>
                          ) : product.stock <= 5 ? (
                            <span className="text-sm font-medium text-orange-600">
                              {product.stock} left
                            </span>
                          ) : (
                            <span className="text-sm text-gray-700">{product.stock}</span>
                          )}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-500">{formatDate(product.createdAt)}</span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openModal(product)}
                              className="p-1.5 rounded text-indigo-600 hover:bg-indigo-50"
                              title="Edit product"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-1.5 rounded text-red-600 hover:bg-red-50"
                              title="Delete product"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && products.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-600">
                  Showing{' '}
                  <span className="font-medium text-gray-900">
                    {((page - 1) * limit) + 1}–{Math.min(page * limit, pagination.total)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium text-gray-900">{pagination.total}</span>{' '}
                  products
                </p>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Rows per page:</span>
                    <select
                      value={limit}
                      onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}
                      className="h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 bg-white"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={20}>20</option>
                    </select>
                  </div>

                  {pagination.pages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                      >
                        « First
                      </button>
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                      >
                        ‹ Prev
                      </button>

                      {getPageNumbers().map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-1 text-sm border rounded font-medium ${page === pageNum
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                        disabled={page === pagination.pages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                      >
                        Next ›
                      </button>
                      <button
                        onClick={() => setPage(pagination.pages)}
                        disabled={page === pagination.pages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                      >
                        Last »
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 border border-gray-200 my-8">
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button onClick={closeModal} className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Images</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        disabled={uploadingImages}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className={`flex flex-col items-center gap-1 cursor-pointer ${uploadingImages ? 'opacity-50' : ''}`}>
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-600">
                          {uploadingImages ? 'Reading images...' : 'Click to upload images'}
                        </span>
                        <span className="text-xs text-gray-500">PNG, JPG, WEBP supported</span>
                      </label>
                    </div>
                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-5 gap-2 mt-3">
                        {formData.images.map((imageUrl, index) => (
                          <div key={index} className="relative">
                            <img
                              src={imageUrl}
                              alt={`Product ${index + 1}`}
                              className="w-full h-16 object-cover rounded border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <input
                      type="text"
                      required
                      value={formData.product_name}
                      onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 text-sm"
                      placeholder="e.g., Diamond Solitaire Ring"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Original Price ($)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.original_price}
                        onChange={(e) => handlePriceChange('original_price', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discounted Price ($)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.discounted_price}
                        onChange={(e) => handlePriceChange('discounted_price', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium">
                        {formData.discounted_percentage}% off
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        required
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 text-sm bg-white"
                        disabled={categories.length === 0}
                      >
                        <option value="">{categories.length === 0 ? 'No categories available' : 'Select a category'}</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                      {categories.length === 0 && (
                        <p className="text-xs text-indigo-600 mt-1">
                          Create categories first in{' '}
                          <Link href="/categories" className="underline font-medium">Categories</Link>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                    <input
                      type="text"
                      required
                      value={formData.short_description}
                      onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 text-sm"
                      placeholder="Brief description (max 150 chars)"
                      maxLength={150}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Long Description</label>
                    <textarea
                      required
                      value={formData.long_description}
                      onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 text-sm resize-none"
                      rows="4"
                      placeholder="Detailed product description..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingImages}
                    className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingImages ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
