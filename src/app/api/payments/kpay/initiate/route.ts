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

export interface PaymentInitiationRequest {
   orderId: string; // Required in one-way flow
   amount: number;
   customerName: string;
   customerEmail: string;
   customerPhone: string;
   paymentMethod: string;
   redirectUrl?: string;
   orderDetails?: string;
   bankId?: string;
   customerNumber?: string;
}

export async function POST(request: NextRequest) {
   const startTime = Date.now();
   let orderId: string | undefined;

   try {
      const body: PaymentInitiationRequest = await request.json();
      orderId = body.orderId;

      logger.info("api", "Payment initiation request received", {
         orderId: body.orderId,
         amount: body.amount,
         paymentMethod: body.paymentMethod,
         customerEmail: body.customerEmail,
      });

      // Basic validation - orderId is now required (one-way flow)
      if (!body.orderId) {
         return NextResponse.json(
            { error: "orderId is required" },
            { status: 400 }
         );
      }

      if (!body.amount || !body.paymentMethod) {
         return NextResponse.json(
            { error: "Amount and payment method are required" },
            { status: 400 }
         );
      }

      // Get auth token from request headers
      const authToken = getAuthToken(request);

      // Forward request to backend
      const backendUrl = `${API_BASE}/payments/initiate`;
      const backendResponse = await fetch(backendUrl, {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
         },
         body: JSON.stringify({
            orderId: body.orderId,
            amount: body.amount,
            customerName: body.customerName,
            customerEmail: body.customerEmail,
            customerPhone: body.customerPhone,
            customerNumber: body.customerNumber || body.customerPhone,
            paymentMethod: body.paymentMethod,
            redirectUrl: body.redirectUrl,
            orderDetails: body.orderDetails || `Order ${body.orderId}`,
            bankId: body.bankId,
         }),
      });

      const backendData = await backendResponse.json();

      if (!backendResponse.ok) {
         logger.error("api", "Backend payment initiation failed", {
            orderId,
            status: backendResponse.status,
            error: backendData.message || backendData.error,
         });
         return NextResponse.json(
            {
               success: false,
               error: backendData.message || backendData.error || "Payment initiation failed",
            },
            { status: backendResponse.status }
         );
      }

      // Transform backend response to match frontend expectations
      const kpayData = backendData.data || {};
      const checkoutUrl = kpayData.url || kpayData.redirecturl || kpayData.redirectUrl;

      logger.info("api", "Payment initiated successfully", {
         orderId,
         transactionId: kpayData.tid,
         checkoutUrl: !!checkoutUrl,
      });

      return NextResponse.json({
         success: true,
         data: kpayData,
         checkoutUrl,
         transactionId: kpayData.tid,
         reference: kpayData.reference || kpayData.orderReference,
         status: "pending",
         message: "Payment initiated successfully",
      });
   } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("api", "Payment initiation failed", {
         orderId,
         error: error instanceof Error ? error.message : String(error),
         duration,
      });

      return NextResponse.json(
         {
            success: false,
            error: "Internal server error",
            technicalError:
               error instanceof Error ? error.message : String(error),
         },
         { status: 500 }
      );
   }
}

export async function GET() {
   return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
