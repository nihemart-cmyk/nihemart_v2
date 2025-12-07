import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { API_BASE } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const startDate = searchParams.get('startDate') || searchParams.get('from') || undefined;
    const endDate = searchParams.get('endDate') || searchParams.get('to') || undefined;

    logger.info('api', 'Fetching transactions from backend', {
      page,
      limit,
      status,
      search,
      sortBy,
      sortOrder,
      startDate,
      endDate
    });

    // Build query params for backend
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (startDate) params.append('from', startDate);
    if (endDate) params.append('to', endDate);
    // Note: Backend may not support all filters yet, but we pass what we can

    // Call backend API
    const backendUrl = `${API_BASE}/payments${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API returned ${response.status}`);
    }

    const backendData = await response.json();
    
    // Backend returns { success: true, data: [...] }
    const payments = backendData.data || [];
    
    // Transform backend data to match frontend expectations (camelCase to snake_case)
    const transformedPayments = payments.map((p: any) => ({
      ...p,
      // Map camelCase to snake_case for compatibility
      created_at: p.createdAt || p.created_at,
      updated_at: p.updatedAt || p.updated_at,
      completed_at: p.completedAt || p.completed_at,
      order_id: p.orderId || p.order_id,
      payment_method: p.paymentMethod || p.payment_method,
      customer_name: p.customerName || p.customer_name,
      customer_email: p.customerEmail || p.customer_email,
      customer_phone: p.customerPhone || p.customer_phone,
      kpay_transaction_id: p.kpayTransactionId || p.kpay_transaction_id,
      kpay_mom_transaction_id: p.kpayMomTransactionId || p.kpay_mom_transaction_id,
      failure_reason: p.failureReason || p.failure_reason,
      client_timeout: p.clientTimeout || p.client_timeout,
      client_timeout_reason: p.clientTimeoutReason || p.client_timeout_reason,
    }));
    
    // Apply client-side filtering for search and pagination if backend doesn't support it
    let filteredPayments = transformedPayments;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPayments = transformedPayments.filter((p: any) => 
        p.reference?.toLowerCase().includes(searchLower) ||
        p.customerName?.toLowerCase().includes(searchLower) ||
        p.customer_email?.toLowerCase().includes(searchLower) ||
        p.kpayTransactionId?.toLowerCase().includes(searchLower) ||
        p.kpay_transaction_id?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting (use snake_case field name)
    if (sortBy) {
      const sortField = sortBy === 'created_at' ? 'created_at' : sortBy;
      filteredPayments.sort((a: any, b: any) => {
        const aVal = a[sortField] || a[sortBy] || '';
        const bVal = b[sortField] || b[sortBy] || '';
        const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    // Apply pagination
    const start = (page - 1) * limit;
    const paginatedPayments = filteredPayments.slice(start, start + limit);
    const total = filteredPayments.length;

    logger.info('api', 'Transactions fetched successfully', {
      count: paginatedPayments.length,
      total,
    });

    return NextResponse.json({
      transactions: paginatedPayments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    logger.error('api', 'Failed to fetch transactions', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return empty result instead of error to prevent UI crashes
    return NextResponse.json({
      transactions: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 1,
      },
    });
  }
}