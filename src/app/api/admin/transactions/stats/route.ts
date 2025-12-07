import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { API_BASE } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    logger.info('api', 'Fetching transaction statistics from backend');

    // Calculate date ranges for current and previous week
    const currentDate = new Date();
    const currentWeekStart = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previousWeekStart = new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch current week payments
    const currentWeekParams = new URLSearchParams();
    currentWeekParams.append('from', currentWeekStart.toISOString());
    const currentWeekResponse = await fetch(`${API_BASE}/payments?${currentWeekParams.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    // Fetch previous week payments
    const previousWeekParams = new URLSearchParams();
    previousWeekParams.append('from', previousWeekStart.toISOString());
    previousWeekParams.append('to', currentWeekStart.toISOString());
    const previousWeekResponse = await fetch(`${API_BASE}/payments?${previousWeekParams.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const currentWeekData = currentWeekResponse.ok ? await currentWeekResponse.json() : { data: [] };
    const previousWeekData = previousWeekResponse.ok ? await previousWeekResponse.json() : { data: [] };

    const currentPayments = currentWeekData.data || [];
    const previousPayments = previousWeekData.data || [];

    // Calculate current week stats
    const currentStats = {
      totalRevenue: currentPayments
        .filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0),
      completedTransactions: currentPayments.filter((p: any) => p.status === 'completed').length,
      failedTransactions: currentPayments.filter((p: any) => p.status === 'failed').length,
      pendingTransactions: currentPayments.filter((p: any) => p.status === 'pending').length,
    };

    // Calculate previous week stats
    const previousStats = {
      totalRevenue: previousPayments
        .filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0),
      completedTransactions: previousPayments.filter((p: any) => p.status === 'completed').length,
      failedTransactions: previousPayments.filter((p: any) => p.status === 'failed').length,
      pendingTransactions: previousPayments.filter((p: any) => p.status === 'pending').length,
    };

    // Calculate percentage changes
    const revenueChange = previousStats.totalRevenue > 0
      ? ((currentStats.totalRevenue - previousStats.totalRevenue) / previousStats.totalRevenue) * 100
      : 0;
    const completedChange = previousStats.completedTransactions > 0
      ? ((currentStats.completedTransactions - previousStats.completedTransactions) / previousStats.completedTransactions) * 100
      : 0;
    const failedChange = previousStats.failedTransactions > 0
      ? ((currentStats.failedTransactions - previousStats.failedTransactions) / previousStats.failedTransactions) * 100
      : 0;
    const pendingChange = previousStats.pendingTransactions > 0
      ? ((currentStats.pendingTransactions - previousStats.pendingTransactions) / previousStats.pendingTransactions) * 100
      : 0;

    const stats = {
      totalRevenue: currentStats.totalRevenue,
      completedTransactions: currentStats.completedTransactions,
      failedTransactions: currentStats.failedTransactions,
      pendingTransactions: currentStats.pendingTransactions,
      revenueChange,
      completedChange,
      failedChange,
      pendingChange,
    };

    logger.info('api', 'Transaction statistics fetched successfully', stats);

    return NextResponse.json(stats);

  } catch (error) {
    logger.error('api', 'Failed to fetch transaction statistics', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return empty stats instead of error to prevent UI crashes
    return NextResponse.json({
      totalRevenue: 0,
      completedTransactions: 0,
      failedTransactions: 0,
      pendingTransactions: 0,
      revenueChange: 0,
      completedChange: 0,
      failedChange: 0,
      pendingChange: 0,
    });
  }
}