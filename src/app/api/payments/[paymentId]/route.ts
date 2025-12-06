import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { API_BASE } from "@/lib/api";

// Helper to extract auth token from request
function getAuthToken(request: NextRequest): string | null {
   const authHeader = request.headers.get("authorization");
   if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.slice(7);
   }
   return null;
}

interface RouteParams {
   params: Promise<{
      paymentId: string;
   }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
   const { paymentId } = await params;

   try {
      logger.info("api", "Payment details request received", { paymentId });

      if (!paymentId) {
         return NextResponse.json(
            { error: "Payment ID is required" },
            { status: 400 }
         );
      }

      // Get auth token from request headers
      const authToken = getAuthToken(request);

      // Forward request to backend
      const backendUrl = `${API_BASE}/payments/${paymentId}`;
      const backendResponse = await fetch(backendUrl, {
         method: "GET",
         headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
         },
      });

      const backendData = await backendResponse.json();

      if (!backendResponse.ok) {
         logger.error("api", "Backend payment fetch failed", {
            paymentId,
            status: backendResponse.status,
            error: backendData.message || backendData.error,
         });
         return NextResponse.json(
            {
               error: backendData.message || backendData.error || "Payment not found",
            },
            { status: backendResponse.status }
         );
      }

      // Transform backend response (camelCase to snake_case for compatibility)
      const payment = backendData.data || backendData;
      const transformed = {
         ...payment,
         order_id: payment.orderId || payment.order_id,
         kpay_transaction_id: payment.kpayTransactionId || payment.kpay_transaction_id,
         kpay_auth_key: payment.kpayAuthKey || payment.kpay_auth_key,
         kpay_return_code: payment.kpayReturnCode || payment.kpay_return_code,
         kpay_response: payment.kpayResponse || payment.kpay_response,
         kpay_webhook_data: payment.kpayWebhookData || payment.kpay_webhook_data,
         kpay_mom_transaction_id: payment.kpayMomTransactionId || payment.kpay_mom_transaction_id,
         kpay_pay_account: payment.kpayPayAccount || payment.kpay_pay_account,
         failure_reason: payment.failureReason || payment.failure_reason,
         client_timeout: payment.clientTimeout || payment.client_timeout,
         client_timeout_reason: payment.clientTimeoutReason || payment.client_timeout_reason,
         created_at: payment.createdAt || payment.created_at,
         updated_at: payment.updatedAt || payment.updated_at,
         completed_at: payment.completedAt || payment.completed_at,
      };

      logger.info("api", "Payment details retrieved successfully", {
         paymentId,
         orderId: transformed.order_id,
         status: transformed.status,
         amount: transformed.amount,
      });

      return NextResponse.json(transformed);
   } catch (error) {
      logger.error("api", "Failed to retrieve payment details", {
         paymentId,
         error: error instanceof Error ? error.message : String(error),
         stack: error instanceof Error ? error.stack : undefined,
      });

      return NextResponse.json(
         { error: "Internal server error" },
         { status: 500 }
      );
   }
}

/**
 * PATCH /api/payments/[paymentId]
 * Note: In one-way flow, payments are always created with orderId, so linking is not needed.
 * This endpoint is kept for backward compatibility but may not be used.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
   try {
      const { paymentId } = await params;
      const body = await request.json();
      const { order_id } = body;

      if (!order_id) {
         return NextResponse.json(
            { error: "order_id is required" },
            { status: 400 }
         );
      }

      logger.warn("api", "PATCH payment endpoint called - not needed in one-way flow", {
         paymentId,
         orderId: order_id,
      });

      // In one-way flow, payments are created with orderId, so linking is not needed
      // Return success for backward compatibility
      return NextResponse.json({
         success: true,
         message: "Payment already linked to order (one-way flow)",
         paymentId,
         orderId: order_id,
      });
   } catch (error) {
      logger.error("api", "Payment link endpoint error", {
         error: error instanceof Error ? error.message : String(error),
      });

      return NextResponse.json(
         { error: "Internal server error" },
         { status: 500 }
      );
   }
}
