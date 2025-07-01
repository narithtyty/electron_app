import { Transaction } from '../lib/transactionService';

interface TransactionPrintViewProps {
  transaction: Transaction;
  onClose: () => void;
}

export function TransactionPrintView({ transaction, onClose }: TransactionPrintViewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Print Header - Only visible when printing */}
        <div className="print-only text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Transaction Receipt</h1>
          <p className="text-gray-600">Transaction ID: {transaction.id}</p>
        </div>

        {/* Screen Header - Hidden when printing */}
        <div className="no-print flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Transaction Details</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              🖨️ Print
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="p-6 print:p-8">
          {/* Company/App Header for Print */}
          <div className="print-only text-center mb-8 pb-4 border-b-2 border-gray-300">
            <h2 className="text-xl font-bold text-gray-900">Electron Finance App</h2>
            <p className="text-gray-600">Transaction Management System</p>
          </div>

          {/* Transaction Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Transaction ID
                </label>
                <p className="mt-1 text-lg font-mono text-gray-900 break-all">
                  {transaction.id}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </label>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {transaction.title}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </label>
                <span
                  className={`inline-flex mt-1 px-3 py-1 text-sm font-semibold rounded-full ${
                    transaction.type === 'income'
                      ? 'bg-green-100 text-green-800'
                      : transaction.type === 'expense'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </label>
                <p className="mt-1 text-lg text-gray-900">
                  {transaction.category || 'Uncategorized'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </label>
                <p
                  className={`mt-1 text-2xl font-bold ${
                    transaction.type === 'income'
                      ? 'text-green-600'
                      : transaction.type === 'expense'
                      ? 'text-red-600'
                      : 'text-blue-600'
                  }`}
                >
                  {transaction.type === 'expense' ? '-' : '+'}
                  {formatCurrency(Math.abs(transaction.amount))}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </label>
                <p className="mt-1 text-lg text-gray-900">
                  {formatDate(transaction.date)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </label>
                <p className="mt-1 text-sm text-gray-600">
                  {formatDateTime(transaction.created_at)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </label>
                <p className="mt-1 text-sm text-gray-600">
                  {formatDateTime(transaction.updated_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {transaction.description && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                Description
              </label>
              <div className="bg-gray-50 print:bg-gray-100 p-4 rounded-md border">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {transaction.description}
                </p>
              </div>
            </div>
          )}

          {/* Summary Box */}
          <div className="bg-gray-50 print:bg-gray-100 p-6 rounded-lg border-2 border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Transaction Type:</p>
                <p className="font-semibold text-gray-900 capitalize">{transaction.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount:</p>
                <p className={`font-bold text-lg ${
                  transaction.type === 'income' ? 'text-green-600' : 
                  transaction.type === 'expense' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {formatCurrency(Math.abs(transaction.amount))}
                </p>
              </div>
            </div>
          </div>

          {/* Print Footer */}
          <div className="print-only mt-8 pt-4 border-t-2 border-gray-300 text-center text-sm text-gray-600">
            <p>Generated on {new Date().toLocaleString()}</p>
            <p>Electron Finance App - Transaction Management System</p>
          </div>
        </div>

        {/* Screen Footer - Hidden when printing */}
        <div className="no-print p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-2">
            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              🖨️ Print Transaction
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          .print-only {
            display: block !important;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          .fixed {
            position: static !important;
            background: white !important;
          }
          
          .bg-black {
            background: transparent !important;
          }
          
          .shadow-xl {
            box-shadow: none !important;
          }
          
          .rounded-lg {
            border-radius: 0 !important;
          }
          
          @page {
            margin: 1in;
            size: A4;
          }
        }
        
        .print-only {
          display: none;
        }
      `}</style>
    </div>
  );
}
