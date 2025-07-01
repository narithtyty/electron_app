import { supabase } from './supabase';

export interface Transaction {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category?: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionData {
  title: string;
  description?: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category?: string;
  date?: string;
}

export interface UpdateTransactionData {
  title?: string;
  description?: string;
  amount?: number;
  type?: 'income' | 'expense' | 'transfer';
  category?: string;
  date?: string;
}

export interface TransactionFilters {
  type?: 'income' | 'expense' | 'transfer';
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

class TransactionService {
  // Get all transactions for the current user
  async getTransactions(filters?: TransactionFilters): Promise<{ data: Transaction[] | null; error: string | null }> {
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters?.dateFrom) {
        query = query.gte('date', filters.dateFrom);
      }
      
      if (filters?.dateTo) {
        query = query.lte('date', filters.dateTo);
      }
      
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching transactions:', error);
        return { data: null, error: error.message };
      }

      return { data: data as Transaction[], error: null };
    } catch (error) {
      console.error('Unexpected error fetching transactions:', error);
      return { data: null, error: 'An unexpected error occurred while fetching transactions' };
    }
  }

  // Get a single transaction by ID
  async getTransaction(id: string): Promise<{ data: Transaction | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching transaction:', error);
        return { data: null, error: error.message };
      }

      return { data: data as Transaction, error: null };
    } catch (error) {
      console.error('Unexpected error fetching transaction:', error);
      return { data: null, error: 'An unexpected error occurred while fetching the transaction' };
    }
  }

  // Create a new transaction
  async createTransaction(transactionData: CreateTransactionData): Promise<{ data: Transaction | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: user.id,
            title: transactionData.title,
            description: transactionData.description,
            amount: transactionData.amount,
            type: transactionData.type,
            category: transactionData.category,
            date: transactionData.date || new Date().toISOString().split('T')[0],
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating transaction:', error);
        return { data: null, error: error.message };
      }

      return { data: data as Transaction, error: null };
    } catch (error) {
      console.error('Unexpected error creating transaction:', error);
      return { data: null, error: 'An unexpected error occurred while creating the transaction' };
    }
  }

  // Update an existing transaction
  async updateTransaction(id: string, transactionData: UpdateTransactionData): Promise<{ data: Transaction | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(transactionData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating transaction:', error);
        return { data: null, error: error.message };
      }

      return { data: data as Transaction, error: null };
    } catch (error) {
      console.error('Unexpected error updating transaction:', error);
      return { data: null, error: 'An unexpected error occurred while updating the transaction' };
    }
  }

  // Delete a transaction
  async deleteTransaction(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting transaction:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Unexpected error deleting transaction:', error);
      return { success: false, error: 'An unexpected error occurred while deleting the transaction' };
    }
  }

  // Get transaction summary (total income, expenses, balance)
  async getTransactionSummary(dateFrom?: string, dateTo?: string): Promise<{ 
    data: { 
      totalIncome: number; 
      totalExpenses: number; 
      balance: number; 
      transactionCount: number 
    } | null; 
    error: string | null 
  }> {
    try {
      let query = supabase.from('transactions').select('amount, type');

      if (dateFrom) {
        query = query.gte('date', dateFrom);
      }
      
      if (dateTo) {
        query = query.lte('date', dateTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching transaction summary:', error);
        return { data: null, error: error.message };
      }

      const transactions = data as Pick<Transaction, 'amount' | 'type'>[];
      
      const summary = transactions.reduce(
        (acc, transaction) => {
          const amount = Math.abs(transaction.amount);
          
          if (transaction.type === 'income') {
            acc.totalIncome += amount;
          } else if (transaction.type === 'expense') {
            acc.totalExpenses += amount;
          }
          
          acc.transactionCount++;
          return acc;
        },
        { totalIncome: 0, totalExpenses: 0, transactionCount: 0 }
      );

      const balance = summary.totalIncome - summary.totalExpenses;

      return { 
        data: { 
          ...summary, 
          balance 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Unexpected error fetching transaction summary:', error);
      return { data: null, error: 'An unexpected error occurred while fetching the transaction summary' };
    }
  }

  // Get unique categories
  async getCategories(): Promise<{ data: string[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('category')
        .not('category', 'is', null);

      if (error) {
        console.error('Error fetching categories:', error);
        return { data: null, error: error.message };
      }

      const categories = [...new Set(data.map(item => item.category).filter(Boolean))];
      return { data: categories, error: null };
    } catch (error) {
      console.error('Unexpected error fetching categories:', error);
      return { data: null, error: 'An unexpected error occurred while fetching categories' };
    }
  }
}

export const transactionService = new TransactionService();
