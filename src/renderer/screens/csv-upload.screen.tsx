import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { Button } from '../components/button'

interface CsvData {
  [key: string]: string | number
}

export function CsvUploadScreen() {
  const [csvData, setCsvData] = useState<CsvData[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [fileName, setFileName] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file')
      return
    }

    setIsLoading(true)
    setError('')
    setFileName(file.name)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`CSV parsing error: ${results.errors[0].message}`)
          setIsLoading(false)
          return
        }

        const data = results.data as CsvData[]
        if (data.length > 0) {
          setHeaders(Object.keys(data[0]))
          setCsvData(data)
        } else {
          setError('No data found in CSV file')
        }
        setIsLoading(false)
      },
      error: (error) => {
        setError(`Error reading file: ${error.message}`)
        setIsLoading(false)
      }
    })
  }

  const handleClearData = () => {
    setCsvData([])
    setHeaders([])
    setFileName('')
    setError('')
    setCurrentPage(1)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Pagination calculations
  const totalPages = Math.ceil(csvData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentData = csvData.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage)
    setCurrentPage(1) // Reset to first page when changing rows per page
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      const startPage = Math.max(1, currentPage - 2)
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
    }

    return pages
  }

  const handleDownloadSample = () => {
    const sampleData = [
      { id: '1', name: 'John Doe', email: 'john.doe@example.com', age: '30', city: 'New York', department: 'Engineering', salary: '75000' },
      { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', age: '25', city: 'Los Angeles', department: 'Marketing', salary: '65000' },
      { id: '3', name: 'Bob Johnson', email: 'bob.johnson@example.com', age: '35', city: 'Chicago', department: 'Sales', salary: '70000' },
      { id: '4', name: 'Alice Brown', email: 'alice.brown@example.com', age: '28', city: 'Houston', department: 'Engineering', salary: '80000' },
      { id: '5', name: 'Charlie Wilson', email: 'charlie.wilson@example.com', age: '32', city: 'Phoenix', department: 'HR', salary: '60000' },
      { id: '6', name: 'Diana Davis', email: 'diana.davis@example.com', age: '29', city: 'Philadelphia', department: 'Marketing', salary: '68000' },
      { id: '7', name: 'Edward Miller', email: 'edward.miller@example.com', age: '31', city: 'San Antonio', department: 'Engineering', salary: '78000' },
      { id: '8', name: 'Fiona Garcia', email: 'fiona.garcia@example.com', age: '27', city: 'San Diego', department: 'Sales', salary: '72000' },
      { id: '9', name: 'George Rodriguez', email: 'george.rodriguez@example.com', age: '33', city: 'Dallas', department: 'HR', salary: '62000' },
      { id: '10', name: 'Helen Martinez', email: 'helen.martinez@example.com', age: '26', city: 'San Jose', department: 'Engineering', salary: '82000' },
      { id: '11', name: 'Ivan Thompson', email: 'ivan.thompson@example.com', age: '34', city: 'Austin', department: 'Engineering', salary: '85000' },
      { id: '12', name: 'Julia Anderson', email: 'julia.anderson@example.com', age: '29', city: 'Jacksonville', department: 'Marketing', salary: '67000' },
      { id: '13', name: 'Kevin White', email: 'kevin.white@example.com', age: '31', city: 'Fort Worth', department: 'Sales', salary: '73000' },
      { id: '14', name: 'Linda Harris', email: 'linda.harris@example.com', age: '27', city: 'Columbus', department: 'Engineering', salary: '79000' },
      { id: '15', name: 'Michael Clark', email: 'michael.clark@example.com', age: '36', city: 'Charlotte', department: 'HR', salary: '64000' }
    ]
    
    const csv = Papa.unparse(sampleData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'sample_data.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Drag and drop handlers
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragActive(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragActive(false)
    const file = event.dataTransfer.files?.[0]
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setError('Please select a CSV file')
        return
      }

      setIsLoading(true)
      setError('')
      setFileName(file.name)

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setError(`CSV parsing error: ${results.errors[0].message}`)
            setIsLoading(false)
            return
          }

          const data = results.data as CsvData[]
          if (data.length > 0) {
            setHeaders(Object.keys(data[0]))
            setCsvData(data)
          } else {
            setError('No data found in CSV file')
          }
          setIsLoading(false)
        },
        error: (error) => {
          setError(`Error reading file: ${error.message}`)
          setIsLoading(false)
        }
      })
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">CSV File Upload</h1>
        <p className="text-gray-600">
          Upload a CSV file to view its contents in a table format
        </p>
      </header>

      {/* Upload Section */}
      <div
        className={`bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 mb-6 text-center transition-colors duration-200 ${isDragActive ? 'border-blue-500 bg-blue-50' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" aria-hidden="true">
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          
          <div>
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-lg font-medium text-gray-900">
                {isLoading ? 'Processing...' : 'Click to upload CSV file'}
              </span>
              <input
                ref={fileInputRef}
                id="file-upload"
                name="file-upload"
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={handleFileUpload}
                disabled={isLoading}
              />
            </label>
            <p className="text-gray-500 mt-2">or drag and drop</p>
          </div>
          
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Loading...' : 'Choose File'}
            </Button>
            
            <Button
              variant="secondary"
              onClick={handleDownloadSample}
              className="bg-gray-200 hover:bg-gray-300"
            >
              Download Sample CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* File Info */}
      {fileName && !error && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-green-800">File Uploaded Successfully</h3>
              <p className="text-sm text-green-700 mt-1">
                {fileName} - {csvData.length} rows loaded
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleClearData}
              className="bg-red-600 hover:bg-red-700"
            >
              Clear Data
            </Button>
          </div>
        </div>
      )}

      {/* Data Table */}
      {csvData.length > 0 && headers.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">CSV Data Table</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {startIndex + 1}-{Math.min(endIndex, csvData.length)} of {csvData.length} rows with {headers.length} columns
                </p>
              </div>

              {/* Rows per page selector */}
              <div className="flex items-center gap-2">
                <label htmlFor="rows-per-page" className="text-sm text-gray-600">
                  Rows per page:
                </label>
                <select
                  id="rows-per-page"
                  value={rowsPerPage}
                  onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  {headers.map((header, index) => (
                    <th
                      key={index}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.map((row, rowIndex) => (
                  <tr key={startIndex + rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {startIndex + rowIndex + 1}
                    </td>
                    {headers.map((header, colIndex) => (
                      <td
                        key={colIndex}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {String(row[header] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, csvData.length)} of {csvData.length} results
                </div>

                <div className="flex items-center gap-2">
                  {/* Previous button */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm"
                  >
                    Previous
                  </Button>

                  {/* Page numbers */}
                  <div className="flex gap-1">
                    {currentPage > 3 && totalPages > 5 && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handlePageChange(1)}
                          className="px-3 py-1 text-sm"
                        >
                          1
                        </Button>
                        <span className="px-2 py-1 text-sm text-gray-500">...</span>
                      </>
                    )}

                    {getPageNumbers().map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 text-sm ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {page}
                      </Button>
                    ))}

                    {currentPage < totalPages - 2 && totalPages > 5 && (
                      <>
                        <span className="px-2 py-1 text-sm text-gray-500">...</span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handlePageChange(totalPages)}
                          className="px-3 py-1 text-sm"
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Next button */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Table Footer with Statistics */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-100">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Total rows: {csvData.length}</span>
              <span>Total columns: {headers.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {csvData.length === 0 && !isLoading && !error && (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 text-gray-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 64 64" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6l3 9h32l3-9h6M9 12l-2-6H3m6 6v6a6 6 0 006 6h26a6 6 0 006-6v-6M9 12h46"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No CSV data loaded</h3>
          <p className="text-gray-600">
            Upload a CSV file to see its contents displayed in a table format
          </p>
        </div>
      )}
    </div>
  )
}
