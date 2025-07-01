import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { transactionService, Transaction, CreateTransactionData, UpdateTransactionData, TransactionFilters } from '../lib/transactionService';
import { useAuth } from './AuthContext';

interface TransactionContextType {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  
  // CRUD operations
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  createTransaction: (data: CreateTransactionData) => Promise<boolean>;
  updateTransaction: (id: string, data: UpdateTransactionData) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  
  // Summary data
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
  
  // Utility functions
  refreshSummary: () => Promise<void>;
  clearError: () => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Summary state
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [balance, setBalance] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);

  // Fetch transactions
  const fetchTransactions = async (filters?: TransactionFilters) => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await transactionService.getTransactions(filters);
      
      if (fetchError) {
        setError(fetchError);
        return;
      }
      
      if (data) {
        setTransactions(data);
      }
    } catch (err) {
      setError('Failed to fetch transactions');
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Create transaction
  const createTransaction = async (data: CreateTransactionData): Promise<boolean> => {
    setError(null);
    
    try {
      const { data: newTransaction, error: createError } = await transactionService.createTransaction(data);
      
      if (createError) {
        setError(createError);
        return false;
      }
      
      if (newTransaction) {
        setTransactions(prev => [newTransaction, ...prev]);
        await refreshSummary();
        return true;
      }
      
      return false;
    } catch (err) {
      setError('Failed to create transaction');
      console.error('Error creating transaction:', err);
      return false;
    }
  };

  // Update transaction
  const updateTransaction = async (id: string, data: UpdateTransactionData): Promise<boolean> => {
    setError(null);
    
    try {
      const { data: updatedTransaction, error: updateError } = await transactionService.updateTransaction(id, data);
      
      if (updateError) {
        setError(updateError);
        return false;
      }
      
      if (updatedTransaction) {
        setTransactions(prev => 
          prev.map(transaction => 
            transaction.id === id ? updatedTransaction : transaction
          )
        );
        await refreshSummary();
        return true;
      }
      
      return false;
    } catch (err) {
      setError('Failed to update transaction');
      console.error('Error updating transaction:', err);
      return false;
    }
  };

  // Delete transaction
  const deleteTransaction = async (id: string): Promise<boolean> => {
    setError(null);
    
    try {
      const { success, error: deleteError } = await transactionService.deleteTransaction(id);
      
      if (deleteError) {
        setError(deleteError);
        return false;
      }
      
      if (success) {
        setTransactions(prev => prev.filter(transaction => transaction.id !== id));
        await refreshSummary();
        return true;
      }
      
      return false;
    } catch (err) {
      setError('Failed to delete transaction');
      console.error('Error deleting transaction:', err);
      return false;
    }
  };

  // Refresh summary data
  const refreshSummary = async () => {
    if (!isAuthenticated) return;
    
    try {
      const { data, error: summaryError } = await transactionService.getTransactionSummary();
      
      if (summaryError) {
        console.error('Error fetching summary:', summaryError);
        return;
      }
      
      if (data) {
        setTotalIncome(data.totalIncome);
        setTotalExpenses(data.totalExpenses);
        setBalance(data.balance);
        setTransactionCount(data.transactionCount);
      }
    } catch (err) {
      console.error('Error refreshing summary:', err);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Load data when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTransactions();
      refreshSummary();
    } else {
      // Clear data when user logs out
      setTransactions([]);
      setTotalIncome(0);
      setTotalExpenses(0);
      setBalance(0);
      setTransactionCount(0);
      setError(null);
    }
  }, [isAuthenticated, user]);

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        isLoading,
        error,
        fetchTransactions,
        createTransaction,
        updateTransaction,
        deleteTransaction,
        totalIncome,
        totalExpenses,
        balance,
        transactionCount,
        refreshSummary,
        clearError,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}
