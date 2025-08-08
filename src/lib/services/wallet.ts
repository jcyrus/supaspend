import { createClient } from "@/lib/supabase/client";
import type { Wallet, WalletInsert } from "@/types/database";

const supabase = createClient();

export class WalletService {
  static async getUserWallets(userId: string): Promise<Wallet[]> {
    const { data, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async createWallet(walletData: WalletInsert): Promise<Wallet> {
    // Check wallet limit
    const { count } = await supabase
      .from("wallets")
      .select("*", { count: "exact", head: true })
      .eq("user_id", walletData.user_id);

    if (count && count >= 5) {
      throw new Error("User cannot have more than 5 wallets");
    }

    // If this is the first wallet, make it default
    if (count === 0) {
      walletData.is_default = true;
    }

    const { data, error } = await supabase
      .from("wallets")
      .insert(walletData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateWallet(
    id: string,
    updates: Partial<WalletInsert>
  ): Promise<Wallet> {
    const { data, error } = await supabase
      .from("wallets")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteWallet(id: string): Promise<void> {
    const { error } = await supabase.from("wallets").delete().eq("id", id);

    if (error) throw error;
  }

  static async setDefaultWallet(
    userId: string,
    walletId: string
  ): Promise<void> {
    // First, unset all default wallets for this user
    await supabase
      .from("wallets")
      .update({ is_default: false })
      .eq("user_id", userId);

    // Then set the new default
    const { error } = await supabase
      .from("wallets")
      .update({ is_default: true })
      .eq("id", walletId)
      .eq("user_id", userId);

    if (error) throw error;
  }

  static async getWalletBalance(walletId: string): Promise<number> {
    // Calculate balance from fund_transactions (reverted for compatibility)
    const { data: fundsIn, error: fundsInError } = await supabase
      .from("fund_transactions")
      .select("amount")
      .eq("wallet_id", walletId)
      .in("transaction_type", ["fund_in", "deposit"]);

    if (fundsInError) {
      console.error("Error getting funds in:", fundsInError);
      throw fundsInError;
    }

    const { data: fundsOut, error: fundsOutError } = await supabase
      .from("fund_transactions")
      .select("amount")
      .eq("wallet_id", walletId)
      .in("transaction_type", ["expense", "fund_out", "withdrawal"]);

    if (fundsOutError) {
      console.error("Error getting funds out:", fundsOutError);
      throw fundsOutError;
    }

    const totalIn =
      fundsIn?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;
    const totalOut =
      fundsOut?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;

    return totalIn - totalOut;
  }

  static async getUserWalletsWithBalances(
    userId: string
  ): Promise<Array<Wallet & { balance: number }>> {
    const wallets = await this.getUserWallets(userId);

    const walletsWithBalances = await Promise.all(
      wallets.map(async (wallet) => {
        const balance = await this.getWalletBalance(wallet.id);
        return { ...wallet, balance };
      })
    );

    return walletsWithBalances;
  }

  static async getDefaultWallet(userId: string): Promise<Wallet | null> {
    const { data, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .eq("is_default", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // No rows found
      throw error;
    }
    return data;
  }

  static async getWalletWithBalance(
    walletId: string
  ): Promise<(Wallet & { balance: number }) | null> {
    const { data, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("id", walletId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // No rows found
      throw error;
    }

    const balance = await this.getWalletBalance(walletId);
    return { ...data, balance };
  }
}
