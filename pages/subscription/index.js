import React, { useState, useEffect } from 'react';
import { ChevronRight, Package, Calendar, DollarSign, CreditCard, AlertCircle, CheckCircle, Clock, Plus, Sparkles, Play, Eye } from 'lucide-react';
import cabocilAPI from '@/apis/cabocil_api';
import Link from 'next/link';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/router';

const SubscriptionIndex = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [snapLoaded, setSnapLoaded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [userSubscription, setUserSubscription] = useState({});

  const fetchOrders = async (page = 1, append = false) => {
    try {
      const response = await cabocilAPI.GetOrderList("", {}, {
        limit: 10,
        page: page,
      })

      if (response.status === 401) {
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data && data.data.orders) {
        const newOrders = data.data.orders;
        setOrders(prev => append ? [...prev, ...newOrders] : newOrders);
        setHasMore(newOrders.length === 10);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  async function fetchUserSubscription() {
    try {
      const response = await cabocilAPI.GetUserSubscription("", {}, {})

      if (response.status === 401) {
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setUserSubscription(data.data);

    } catch (err) {
      console.error('Error fetching user subscription:', err);
      setError(err.message);
    }
  }

  useEffect(() => {
    fetchUserSubscription();
    fetchOrders([]);
    setLoading(false);
  }, [pathname]);

  const loadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchOrders(nextPage, true);
  };

  // Update current time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOrderClick = (order) => {
    if (isOrderExpired(order) && order.status === 'initialized') {
      return; // Don't navigate if expired
    }

    router.push(`#`);
  };

  const isOrderExpired = (order) => {
    if (!order.payment_expired_at) {
      return false;
    }
    return new Date(order.payment_expired_at) < currentTime;
  };

  const getTimeRemaining = (expiredAt) => {
    if (!expiredAt || expiredAt === "0001-01-01T00:00:00Z") {
      return null;
    }

    const expiredTime = new Date(expiredAt);
    const timeDiff = expiredTime - currentTime;

    if (timeDiff <= 0) {
      return null;
    }

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'initialized':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status, isExpired = false) => {
    if (isExpired) {
      return 'bg-gray-50 text-gray-700 border-gray-200';
    }

    switch (status) {
      case 'complete':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'initialized':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950 dark:via-slate-950 dark:to-orange-950 flex items-center justify-center">
        <div className="inline-flex items-center gap-3 text-slate-500">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          Loading your subscriptions...
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Load Midtrans Snap.js */}
      <Script
        src={cabocilAPI.SnapJSUrl} // Use https://app.midtrans.com/snap/snap.js for production
        data-client-key={cabocilAPI.SnapClientKey} // Add your client key to environment variables
        onLoad={() => setSnapLoaded(true)}
        onError={() => console.error('Failed to load Snap.js')}
      />

      <div className="h-[calc(100vh-70px)] to-orange-50 dark:from-purple-950 dark:via-slate-950 dark:to-orange-950 text-slate-900 dark:text-slate-100 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-center justify-between text-center mb-6">
            <div className="flex items-center gap-3 text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent align-middle">
              <Package className="w-8 h-8 text-purple-600" />
              My Subscriptions
            </div>

            <Link href="/subscription/package">
              <button
                className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white px-4 py-2 rounded-2xl font-medium inline-flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                Beli Subscription Baru
              </button>
            </Link>
          </div>

          <div
            className={`group relative overflow-hidden rounded-2xl border-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm transition-all duration-300 border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-purple-200 dark:hover:border-purple-800 mb-6`}
          >
            <div className="p-4">
              {userSubscription.active ? `Subscription Aktif Sampai: ${formatDate(userSubscription.ended_at)}` : "Tidak Ada Subscription Aktif"}
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Package className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Order tidak ditemukan</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Kamu belum melakukan transaksi.</p>
              <Link href="/subscription/package">
                <button
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-2xl font-medium inline-flex items-center gap-2 transition-all duration-300 gap-1"
                >
                  <Sparkles className="w-5 h-5" />
                  Mulai Berlangganan
                </button>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {orders.map((order, index) => {
                  const isExpired = isOrderExpired(order);
                  const timeRemaining = getTimeRemaining(order.payment_expired_at);
                  const hasSnapToken = order.payment_metadata?.snap_token && order.payment_metadata.snap_token.length > 0;

                  return (
                    <div
                      key={order.number}
                      onClick={() => handleOrderClick(order)}
                      className={`group relative overflow-hidden rounded-2xl border-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm transition-all duration-300 ${
                        isExpired && order.status === 'initialized'
                          ? 'border-gray-200 dark:border-gray-800 opacity-60 cursor-not-allowed'
                          : 'border-slate-200 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 hover:border-purple-200 dark:hover:border-purple-800 cursor-pointer'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className='flex items-center justify-between'>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold">{order.description}</h3>
                                {!isExpired && (
                                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
                                )}
                              </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(order.status, isExpired)}`}>
                                {getStatusIcon(order.status)}
                                {isExpired && order.status === 'initialized' ? 'Kadaluarsa' : order.human_status}
                              </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{order.number}</p>

                            <div className="flex flex-row gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-600 dark:text-slate-400">
                                  {formatDate(order.created_at)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-slate-500" />
                                <div className="flex items-center gap-2">
                                  {order.discount_amount > 0 && (
                                    <>
                                      <span className="line-through text-slate-400 text-xs">
                                        {formatPrice(order.base_price)}
                                      </span>
                                      <span className="text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded-full">
                                        -{Math.round(((order.discount_amount) / order.base_price) * 100)}%
                                      </span>
                                    </>
                                  )}
                                  <span className="font-medium text-purple-600">
                                    {formatPrice(order.final_price)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-600 dark:text-slate-400 font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                  {order.metadata?.product_code || 'N/A'}
                                </span>
                              </div>
                            </div>

                            <div className='flex items-center justify-between mt-3'>
                              {/* Countdown Timer for pending payments */}
                              <div>
                                {order.status === 'initialized' && timeRemaining && !isExpired && (
                                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                    <div className="flex items-center gap-2 text-sm">
                                      <Clock className="w-4 h-4 text-yellow-600" />
                                      <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                                        Pembayaran berakhir dalam:
                                        <span className="ml-2 font-mono">
                                          {String(timeRemaining.hours).padStart(2, '0')}:
                                          {String(timeRemaining.minutes).padStart(2, '0')}:
                                          {String(timeRemaining.seconds).padStart(2, '0')}
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col gap-2 items-end ml-4">
                                {/* Action buttons */}
                                {order.status === 'complete' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOrderClick(order);
                                    }}
                                    className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-all duration-200"
                                  >
                                    <Eye className="w-3 h-3" />
                                    Detail
                                  </button>
                                )}

                                {order.status === 'initialized' && hasSnapToken && !isExpired && (
                                  <Link href={order.payment_metadata.snap_url} target="_blank">
                                    <button
                                      className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-all duration-200 bg-blue-100 hover:bg-blue-200 text-blue-700 cursor-pointer`}
                                    >
                                      <Play className="w-3 h-3" />
                                      Lanjutkan Pembayaran
                                    </button>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Decorative elements */}
                      {!isExpired && (
                        <>
                          <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-xl group-hover:from-purple-400/20 group-hover:to-pink-400/20 transition-all duration-300"></div>
                          <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-gradient-to-br from-orange-400/10 to-yellow-400/10 rounded-full blur-xl group-hover:from-orange-400/20 group-hover:to-yellow-400/20 transition-all duration-300"></div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {hasMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={loadMore}
                    className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-2xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-300"
                  >
                    Load More Orders
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default SubscriptionIndex;