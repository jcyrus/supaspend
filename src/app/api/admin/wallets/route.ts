import { NextRequest } from "next/server";
import {
  withAuth,
  validateRequiredFields,
  errorResponse,
  successResponse,
} from "@/lib/api-middleware";
import { WalletService } from "@/lib/services/wallet";
import type { Currency } from "@/types/database";

// GET /api/admin/wallets?userId=xxx - Get wallets for a user
export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, {
    requireRole: ["admin", "superadmin"],
  });

  if (!authResult.success) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return errorResponse("userId parameter is required");
    }

    const wallets = await WalletService.getUserWalletsWithBalances(userId);
    return successResponse({ wallets });
  } catch (error) {
    console.error("Error fetching wallets:", error);
    return errorResponse("Failed to fetch wallets", 500);
  }
}

// POST /api/admin/wallets - Create a new wallet
export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, {
    requireRole: ["admin", "superadmin"],
  });

  if (!authResult.success) {
    return authResult.response!;
  }

  try {
    const body = await request.json();
    const { user_id, currency, name } = body;

    const validation = validateRequiredFields(body, [
      "user_id",
      "currency",
      "name",
    ]);
    if (!validation.isValid) {
      return errorResponse(
        `Missing required fields: ${validation.missingFields?.join(", ")}`
      );
    }

    // Validate currency
    if (!["USD", "VND", "IDR", "PHP"].includes(currency)) {
      return errorResponse("Invalid currency. Must be USD, VND, IDR, or PHP");
    }

    const wallet = await WalletService.createWallet({
      user_id,
      currency: currency as Currency,
      name,
      is_default: false, // New wallets are not default by default
    });

    return successResponse({
      message: "Wallet created successfully",
      wallet,
    });
  } catch (error) {
    console.error("Error creating wallet:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to create wallet",
      500
    );
  }
}

// PUT /api/admin/wallets - Update wallet or set default
export async function PUT(request: NextRequest) {
  const authResult = await withAuth(request, {
    requireRole: ["admin", "superadmin"],
  });

  if (!authResult.success) {
    return authResult.response!;
  }

  try {
    const body = await request.json();
    const { walletId, action, name, userId } = body;

    if (!walletId) {
      return errorResponse("walletId is required");
    }

    if (action === "setDefault") {
      if (!userId) {
        return errorResponse("userId is required for setDefault action");
      }
      await WalletService.setDefaultWallet(userId, walletId);
      return successResponse({ message: "Default wallet updated" });
    } else if (action === "update") {
      if (!name) {
        return errorResponse("name is required for update action");
      }
      const wallet = await WalletService.updateWallet(walletId, { name });
      return successResponse({ message: "Wallet updated", wallet });
    } else {
      return errorResponse("Invalid action. Must be 'setDefault' or 'update'");
    }
  } catch (error) {
    console.error("Error updating wallet:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to update wallet",
      500
    );
  }
}

// DELETE /api/admin/wallets?walletId=xxx - Delete a wallet
export async function DELETE(request: NextRequest) {
  const authResult = await withAuth(request, {
    requireRole: ["admin", "superadmin"],
  });

  if (!authResult.success) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get("walletId");

    if (!walletId) {
      return errorResponse("walletId parameter is required");
    }

    await WalletService.deleteWallet(walletId);
    return successResponse({ message: "Wallet deleted successfully" });
  } catch (error) {
    console.error("Error deleting wallet:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to delete wallet",
      500
    );
  }
}
