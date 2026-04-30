'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export default function CartPage() {
  const [carts, setCarts] = useState([])
  const [allCarts, setAllCarts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedCart, setSelectedCart] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [sortBy, setSortBy] = useState('last_updated')
  const [sortOrder, setSortOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState({ total: 0, pages: 0 })

  useEffect(() => {
    fetchCarts()
  }, [searchTerm, sortBy, sortOrder, page, limit])

  const fetchCarts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchTerm,
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: limit.toString()
      })
      const response = await fetch(`/api/cart?₹{params}`)
      if (response.ok) {
        const data = await response.json()
        setCarts(data.carts || [])
        if (data.pagination) {
          setPagination(data.pagination)
        }
        // Fetch all carts for stats
        const allCartsResponse = await fetch('/api/cart')
        if (allCartsResponse.ok) {
          const allCartsData = await allCartsResponse.json()
          setAllCarts(allCartsData.carts || [])
        }
      } else {
        toast.error('Failed to fetch carts')
      }
    } catch (error) {
      console.error('Error fetching carts:', error)
      toast.error('Error fetching carts')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this cart?')) return

    try {
      const response = await fetch(`/api/cart/₹{id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Cart deleted successfully!')
        fetchCarts()
      } else {
        toast.error('Failed to delete cart')
      }
    } catch (error) {
      console.error('Error deleting cart:', error)
      toast.error('Error deleting cart')
    }
  }

  const viewCartDetails = (cart) => {
    setSelectedCart(cart)
    setShowDetailModal(true)
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

  const getTotalItems = () => {
    return allCarts.reduce((total, cart) => total + (cart.items?.length || 0), 0)
  }

  const getTotalValue = () => {
    return allCarts.reduce((total, cart) => total + (cart.grand_total || 0), 0).toFixed(2)
  }

  const getActiveCarts = () => {
    return allCarts.filter(cart => cart.items && cart.items.length > 0).length
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
    if (sortBy !== field) {
      return <span className="ml-1 text-gray-400 text-xs">⇅</span>
    }
    return sortOrder === 'asc' ? (
      <span className="ml-1 text-indigo-600 text-xs">↑</span>
    ) : (
      <span className="ml-1 text-indigo-600 text-xs">↓</span>
    )
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
      <Sidebar activePage="cart" />

      <main className="ml-72 flex flex-col min-h-screen">
        <Header title="Shopping Carts" subtitle="View and manage customer shopping carts" />

        <div className="p-8">

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-indigo-600">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Total Carts</p>
                  <p className="text-2xl font-semibold text-gray-900">{carts.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-green-600">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Active Carts</p>
                  <p className="text-2xl font-semibold text-gray-900">{getActiveCarts()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-blue-600">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Total Value</p>
                  <p className="text-2xl font-semibold text-gray-900">₹{getTotalValue()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by session ID..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setFilterStatus('all'); setPage(1) }}
                  className={`px-3 py-2 rounded-lg text-sm ₹{filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  All
                </button>
                <button
                  onClick={() => { setFilterStatus('active'); setPage(1) }}
                  className={`px-3 py-2 rounded-lg text-sm ₹{filterStatus === 'active' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Active
                </button>
                <button
                  onClick={() => { setFilterStatus('empty'); setPage(1) }}
                  className={`px-3 py-2 rounded-lg text-sm ₹{filterStatus === 'empty' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Empty
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th
                      onClick={() => handleSort('session_id')}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      Session ID <SortIcon field="session_id" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Items</th>
                    <th
                      onClick={() => handleSort('subtotal')}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      Subtotal <SortIcon field="subtotal" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Shipping</th>
                    <th
                      onClick={() => handleSort('grand_total')}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      Total <SortIcon field="grand_total" />
                    </th>
                    <th
                      onClick={() => handleSort('last_updated')}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      Last Updated <SortIcon field="last_updated" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
                          <p className="text-sm text-gray-500">Loading carts...</p>
                        </div>
                      </td>
                    </tr>
                  ) : carts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-gray-600 font-medium">No carts found</p>
                        <p className="text-gray-500 text-sm mt-1">
                          {searchTerm ? 'Try a different search term' : 'Carts will appear here when customers add items'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    carts.map((cart) => (
                      <tr key={cart.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900 font-mono">
                            {cart.session_id?.substring(0, 20)}...
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ₹{
                            cart.items && cart.items.length > 0
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {cart.items?.length || 0} items
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          ₹{(cart.subtotal || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          ₹{(cart.shipping_charge || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₹{(cart.grand_total || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(cart.last_updated)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => viewCartDetails(cart)}
                              className="p-1.5 rounded text-blue-600 hover:bg-blue-50"
                              title="View Details"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(cart.id)}
                              className="p-1.5 rounded text-red-600 hover:bg-red-50"
                              title="Delete Cart"
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

            {!loading && carts.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-600">
                  Showing{' '}
                  <span className="font-medium text-gray-900">
                    {((page - 1) * limit) + 1}–{Math.min(page * limit, pagination.total)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium text-gray-900">{pagination.total}</span>{' '}
                  carts
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
                          className={`px-3 py-1 text-sm border rounded font-medium ₹{
                            page === pageNum
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

          {showDetailModal && selectedCart && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl mx-4 border border-gray-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Cart Details</h3>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Session ID</p>
                      <p className="text-sm font-medium text-gray-900 font-mono">{selectedCart.session_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="text-sm text-gray-900">{formatDate(selectedCart.last_updated)}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Cart Items</h4>
                    {selectedCart.items && selectedCart.items.length > 0 ? (
                      <div className="space-y-3">
                        {selectedCart.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              {item.product_id?.images?.[0] && (
                                <img
                                  src={item.product_id.images[0]}
                                  alt={item.product_id.product_name || item.product_name}
                                  className="w-16 h-16 rounded-lg object-cover mr-4"
                                />
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {item.product_id?.product_name || item.product_name}
                                </p>
                                <p className="text-sm text-gray-500">Qty: {item.quantity} × ₹{item.price?.toFixed(2)}</p>
                              </div>
                            </div>
                            <p className="text-sm font-medium text-gray-900">₹{item.subtotal?.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No items in cart</p>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">₹{(selectedCart.subtotal || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium">₹{(selectedCart.shipping_charge || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>₹{(selectedCart.grand_total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
